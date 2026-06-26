"""
Konara GenAI Service — LLM + RAG powered features
Uses Gemini 2.5 Flash for all AI capabilities.

Features:
1. Natural Language Search (intent parsing + query expansion)
2. Conversational Cart Builder
3. Basket Comparison Agent (cheapest combo across vendors)
4. Smart Substitution Engine
5. Festival/Occasion Shopping Lists
6. Dietary Filter Assistant
7. Smart Recommendations (RAG)
"""
import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


async def call_gemini(prompt: str) -> str:
    """Core LLM call to Gemini."""
    if not GEMINI_API_KEY:
        return ""
    try:
        async with httpx.AsyncClient(verify=False, timeout=45) as client:
            resp = await client.post(
                GEMINI_URL,
                params={"key": GEMINI_API_KEY},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3},
                },
            )
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        return ""


def clean_json(text: str) -> str:
    """Remove markdown code blocks from LLM response."""
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
    return text.strip()


# ============================================================
# 1. NATURAL LANGUAGE SEARCH (Intent Parsing + Query Expansion)
# ============================================================
async def expand_search_query(query: str) -> dict:
    """
    RAG Step 1: Parse natural language into structured search filters.
    LLM acts as an intent parser with tool-use style output.
    """
    prompt = f"""You are a grocery search intent parser. Convert this query into structured filters.

Query: "{query}"

Return ONLY valid JSON:
{{
    "items": ["list of specific grocery product names to search"],
    "max_price": null or number,
    "max_distance_km": 5,
    "category": null or "dairy/vegetables/grains/meat/bakery/spices/fruits/grocery",
    "sort": "price" or "distance",
    "is_compound": true/false
}}

Examples:
- "ingredients for biryani" → items: ["basmati rice", "chicken", "onion", "tomato", "curd", "biryani masala", "oil", "mint leaves", "ginger garlic"]
- "cheapest milk" → items: ["milk"], sort: "price"
- "breakfast items under 100" → items: ["bread", "eggs", "butter", "milk"], max_price: 100
- "fruits for juice" → items: ["orange", "apple", "mango", "watermelon"]

Return ONLY JSON."""

    text = await call_gemini(prompt)
    try:
        return json.loads(clean_json(text))
    except:
        return {"items": [query], "max_price": None, "max_distance_km": 5, "sort": "price", "is_compound": False}


# ============================================================
# 2. CONVERSATIONAL CART BUILDER
# ============================================================
async def parse_cart_message(message: str, available_products: list) -> dict:
    """
    User says something like "I need stuff for making chai for 10 people"
    LLM understands context, calculates quantities, returns items to add.
    
    RAG: We provide available products as context so LLM only suggests what's actually in stock.
    """
    product_list = [f"{p['name']} (₹{p['price']}, {p['category']})" for p in available_products[:80]]

    prompt = f"""You are a smart grocery cart assistant. The user wants to add items to their cart.

User message: "{message}"

Available products in nearby shops:
{json.dumps(product_list, indent=1)}

Based on the user's message, determine what products they need and suggested quantities.
Return ONLY valid JSON:
{{
    "understanding": "1 sentence of what user wants",
    "items_to_add": [
        {{"name": "exact product name from available list", "qty": number, "reason": "why this item"}}
    ],
    "total_estimated": estimated total price,
    "suggestion": "optional helpful tip"
}}

Rules:
- ONLY suggest products that exist in the available list above
- Calculate appropriate quantities based on context (e.g., "10 people" = more quantity)
- Be practical about grocery quantities"""

    text = await call_gemini(prompt)
    try:
        return json.loads(clean_json(text))
    except:
        return {"understanding": "Could not parse", "items_to_add": [], "suggestion": "Try being more specific"}


# ============================================================
# 3. BASKET COMPARISON AGENT (Cheapest combo across vendors)
# ============================================================
async def find_cheapest_basket(items: list, products_by_vendor: dict) -> dict:
    """
    Given a list of items the customer wants, find the cheapest combination
    across all vendors. Some items from Vendor A, others from Vendor B.
    
    RAG: Retrieves all matching products with prices, LLM optimizes the selection.
    """
    prompt = f"""You are a price optimization agent for a grocery marketplace.

Customer wants these items: {json.dumps(items)}

Available options per vendor:
{json.dumps(products_by_vendor, indent=2)}

Find the CHEAPEST combination. You can mix vendors — buy each item from whichever vendor has the lowest price.

Return ONLY valid JSON:
{{
    "optimized_basket": [
        {{"item": "product name", "vendor": "vendor name", "price": number}}
    ],
    "total_cost": number,
    "savings_tip": "how much they save vs buying all from one shop",
    "vendors_needed": ["list of vendor names involved"]
}}"""

    text = await call_gemini(prompt)
    try:
        return json.loads(clean_json(text))
    except:
        return {"optimized_basket": [], "total_cost": 0, "savings_tip": "Could not optimize"}


# ============================================================
# 4. SMART SUBSTITUTION ENGINE
# ============================================================
async def suggest_substitutions(unavailable_item: str, available_products: list) -> dict:
    """
    When a product is out of stock, suggest alternatives from available inventory.
    RAG: retrieves similar products, LLM ranks by suitability.
    """
    product_names = [f"{p['name']} (₹{p['price']}, {p['vendor_name']})" for p in available_products[:60]]

    prompt = f"""A customer wants "{unavailable_item}" but it's out of stock.

Available alternatives in nearby shops:
{json.dumps(product_names)}

Suggest 3 best substitutes from the available list. Consider:
- Similar product type
- Similar use case
- Price range

Return ONLY valid JSON:
{{
    "original": "{unavailable_item}",
    "substitutes": [
        {{"name": "product name", "reason": "why this is a good substitute", "match_score": 1-10}}
    ],
    "tip": "cooking/usage tip for the substitute"
}}"""

    text = await call_gemini(prompt)
    try:
        return json.loads(clean_json(text))
    except:
        return {"original": unavailable_item, "substitutes": [], "tip": "No substitutes found"}


# ============================================================
# 5. FESTIVAL / OCCASION SHOPPING LIST
# ============================================================
async def generate_occasion_list(occasion: str, people_count: int, available_products: list) -> dict:
    """
    Generate a complete shopping list for festivals/occasions.
    RAG: matches generated list against actual available products.
    """
    product_names = [p["name"] for p in available_products[:80]]

    prompt = f"""Generate a complete grocery shopping list for: {occasion}
Number of people: {people_count}

Available products in nearby shops: {json.dumps(product_names)}

Return ONLY valid JSON:
{{
    "occasion": "{occasion}",
    "people": {people_count},
    "categories": [
        {{
            "category_name": "e.g., Main Ingredients",
            "items": [
                {{"name": "exact product name from available list", "qty": number, "note": "brief note"}}
            ]
        }}
    ],
    "estimated_total": number,
    "tips": ["1-2 preparation tips"],
    "missing_items": ["items needed but not available in shops"]
}}

Rules:
- ONLY include items that exist in the available products list
- Adjust quantities for the number of people
- Group logically (main ingredients, spices, sides, etc.)"""

    text = await call_gemini(prompt)
    try:
        return json.loads(clean_json(text))
    except:
        return {"occasion": occasion, "categories": [], "tips": [], "missing_items": []}


# ============================================================
# 6. DIETARY FILTER ASSISTANT
# ============================================================
async def filter_by_diet(diet_type: str, available_products: list) -> dict:
    """
    Filter and recommend products based on dietary restrictions.
    LLM understands health context beyond simple keyword matching.
    """
    products_info = [f"{p['name']} ({p['category']}, ₹{p['price']})" for p in available_products[:80]]

    prompt = f"""A customer has this dietary requirement: "{diet_type}"

Available products:
{json.dumps(products_info)}

Classify each product as SAFE, AVOID, or MODERATE for this diet.
Return ONLY valid JSON:
{{
    "diet": "{diet_type}",
    "safe_products": ["list of product names that are safe"],
    "avoid_products": ["list of product names to avoid"],
    "moderate_products": ["list that's ok in limited quantities"],
    "advice": "1-2 sentences of dietary advice",
    "meal_suggestion": "a simple meal they can make from safe products"
}}"""

    text = await call_gemini(prompt)
    try:
        return json.loads(clean_json(text))
    except:
        return {"diet": diet_type, "safe_products": [], "avoid_products": [], "advice": "Could not analyze"}


# ============================================================
# 7. SMART RECOMMENDATIONS (RAG)
# ============================================================
async def get_smart_recommendations(cart_items: list, order_history: list, available_products: list) -> dict:
    """
    RAG-powered recommendations combining:
    - Current cart context
    - Past order patterns
    - Available inventory
    """
    cart_names = [item.get("name", "") for item in cart_items]
    history_names = [item for order in order_history for item in order.get("items", [])][:20]
    available_names = [f"{p['name']} (₹{p['price']})" for p in available_products[:60]]

    prompt = f"""You are a smart grocery recommendation engine.

Current cart: {json.dumps(cart_names)}
Past purchases: {json.dumps(history_names)}
Available products: {json.dumps(available_names)}

Suggest 5 products the customer should add. Consider:
- What complements their current cart
- What they regularly buy but haven't added yet
- What goes well together for cooking

Return ONLY valid JSON:
{{
    "recommendations": [
        {{"name": "product name", "reason": "why they need this", "priority": "high/medium/low"}}
    ],
    "insight": "1 sentence about their shopping pattern"
}}"""

    text = await call_gemini(prompt)
    try:
        return json.loads(clean_json(text))
    except:
        return {"recommendations": [], "insight": ""}
