"""
AI-powered endpoints for Konara marketplace.
Each endpoint demonstrates a different GenAI/RAG pattern.
"""
from fastapi import APIRouter, Depends
from bson import ObjectId
from app.database import products_col, vendors_col, orders_col
from app.auth_utils import get_current_user
from app.genai_service import (
    parse_cart_message,
    find_cheapest_basket,
    suggest_substitutions,
    generate_occasion_list,
    filter_by_diet,
    get_smart_recommendations,
)

router = APIRouter()


async def get_all_available_products():
    """Helper: retrieve all in-stock products for RAG context."""
    cursor = products_col.find({"stock_qty": {"$gt": 0}})
    products = []
    async for p in cursor:
        p["id"] = str(p["_id"])
        del p["_id"]
        products.append(p)
    return products


# ============================================================
# 1. CONVERSATIONAL CART BUILDER
# ============================================================
@router.post("/cart-builder")
async def ai_cart_builder(body: dict, user=Depends(get_current_user)):
    """
    User describes what they need in natural language.
    AI understands, finds matching products, suggests quantities.
    
    Example: "I want to make chai for 10 people"
    → Returns: milk (2L), tea powder, sugar, ginger with quantities
    """
    message = body.get("message", "")
    available = await get_all_available_products()
    result = await parse_cart_message(message, available)

    # Match suggested items to actual products with IDs
    matched_items = []
    for item in result.get("items_to_add", []):
        product = await products_col.find_one({
            "name": {"$regex": item["name"], "$options": "i"},
            "stock_qty": {"$gt": 0}
        })
        if product:
            matched_items.append({
                "id": str(product["_id"]),
                "name": product["name"],
                "price": product["price"],
                "vendor_name": product["vendor_name"],
                "qty": item["qty"],
                "reason": item["reason"],
            })

    return {
        "understanding": result.get("understanding", ""),
        "items": matched_items,
        "total_estimated": sum(i["price"] * i["qty"] for i in matched_items),
        "suggestion": result.get("suggestion", ""),
    }


# ============================================================
# 2. BASKET COMPARISON (Price Optimizer)
# ============================================================
@router.post("/compare-basket")
async def ai_compare_basket(body: dict, user=Depends(get_current_user)):
    """
    Given items customer wants, find the cheapest combination across all vendors.
    
    Example: ["milk", "rice", "oil"]
    → Shows cheapest source for each item across 10 vendors
    """
    items = body.get("items", [])
    if not items:
        return {"error": "Provide items list"}

    # RAG: Retrieve all matching products grouped by vendor
    products_by_vendor = {}
    for item in items:
        cursor = products_col.find({"$text": {"$search": item}, "stock_qty": {"$gt": 0}})
        async for p in cursor:
            vendor = p["vendor_name"]
            if vendor not in products_by_vendor:
                products_by_vendor[vendor] = []
            products_by_vendor[vendor].append({
                "name": p["name"],
                "price": p["price"],
                "item_search": item,
            })

    result = await find_cheapest_basket(items, products_by_vendor)
    return result


# ============================================================
# 3. SMART SUBSTITUTION
# ============================================================
@router.post("/substitution")
async def ai_substitution(body: dict, user=Depends(get_current_user)):
    """
    When a product is out of stock, AI suggests alternatives.
    
    Example: "Paneer 200g" is unavailable
    → Suggests: Tofu, Cheese, Cottage Cheese from other vendors
    """
    item_name = body.get("item", "")
    if not item_name:
        return {"error": "Provide item name"}

    available = await get_all_available_products()
    result = await suggest_substitutions(item_name, available)
    return result


# ============================================================
# 4. FESTIVAL / OCCASION SHOPPING LIST
# ============================================================
@router.post("/occasion-list")
async def ai_occasion_list(body: dict, user=Depends(get_current_user)):
    """
    Generate complete shopping list for an occasion/festival.
    
    Example: {"occasion": "Eid biryani party", "people": 15}
    → Returns categorized ingredient list mapped to available products
    """
    occasion = body.get("occasion", "")
    people = body.get("people", 4)
    if not occasion:
        return {"error": "Provide occasion"}

    available = await get_all_available_products()
    result = await generate_occasion_list(occasion, people, available)
    return result


# ============================================================
# 5. DIETARY FILTER
# ============================================================
@router.post("/dietary-filter")
async def ai_dietary_filter(body: dict, user=Depends(get_current_user)):
    """
    Filter products based on dietary needs using AI understanding.
    
    Example: {"diet": "diabetic"} or {"diet": "vegan"} or {"diet": "high protein low carb"}
    → Classifies all products as safe/avoid/moderate
    """
    diet = body.get("diet", "")
    if not diet:
        return {"error": "Provide diet type"}

    available = await get_all_available_products()
    result = await filter_by_diet(diet, available)
    return result


# ============================================================
# 6. SMART RECOMMENDATIONS
# ============================================================
@router.post("/recommendations")
async def ai_recommendations(body: dict, user=Depends(get_current_user)):
    """
    RAG-powered recommendations based on cart + order history.
    
    Combines: current cart context + past orders + available inventory
    """
    cart_items = body.get("cart", [])

    # Retrieve order history for this user
    cursor = orders_col.find({"customer_id": user["sub"]}).sort("created_at", -1).limit(5)
    order_history = []
    async for order in cursor:
        for sub in order.get("sub_orders", []):
            order_history.append({"items": [i["name"] for i in sub["items"]]})

    available = await get_all_available_products()
    result = await get_smart_recommendations(cart_items, order_history, available)

    # Match recommendations to actual products
    matched = []
    for rec in result.get("recommendations", []):
        product = await products_col.find_one({
            "name": {"$regex": rec["name"], "$options": "i"},
            "stock_qty": {"$gt": 0}
        })
        if product:
            matched.append({
                "id": str(product["_id"]),
                "name": product["name"],
                "price": product["price"],
                "vendor_name": product["vendor_name"],
                "reason": rec["reason"],
                "priority": rec["priority"],
            })

    return {"recommendations": matched, "insight": result.get("insight", "")}
