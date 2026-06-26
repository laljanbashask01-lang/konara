import os
import json
import httpx
from fastapi import APIRouter, Depends
from app.database import products_col, vendors_col
from app.models import SearchQuery
from app.auth_utils import get_current_user

router = APIRouter()

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "")
CLAUDE_URL = "https://api.anthropic.com/v1/messages"


async def parse_intent_with_claude(query: str) -> dict:
    """Use Claude to parse natural language into structured search filters."""
    if not CLAUDE_API_KEY:
        return {"items": [query], "max_price": None, "max_distance_km": 5}

    system_prompt = """You extract structured search filters from natural language queries about grocery/food shopping.
Return JSON with: {"items": ["item1", "item2"], "max_price": number|null, "max_distance_km": number, "category": string|null}
For compound requests like "ingredients for biryani", expand into individual items.
Only return valid JSON, nothing else."""

    try:
        async with httpx.AsyncClient(verify=False, timeout=30) as client:
            resp = await client.post(
                CLAUDE_URL,
                headers={
                    "x-api-key": CLAUDE_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 300,
                    "messages": [{"role": "user", "content": query}],
                    "system": system_prompt,
                },
            )
            resp.raise_for_status()
            text = resp.json()["content"][0]["text"]
            return json.loads(text)
    except Exception as e:
        print(f"Claude error: {e}")
        return {"items": [query], "max_price": None, "max_distance_km": 5}


@router.post("/")
async def search_products(data: SearchQuery, user=Depends(get_current_user)):
    """Search products — plain text or AI-powered natural language."""
    # Determine if query is conversational (use AI) or plain keyword
    is_conversational = any(word in data.query.lower() for word in
        ["ingredients for", "what do i need", "cheapest", "best", "near me", "within"])

    if is_conversational and CLAUDE_API_KEY:
        parsed = await parse_intent_with_claude(data.query)
        items = parsed.get("items", [data.query])
        max_price = parsed.get("max_price") or data.max_price
        max_distance = parsed.get("max_distance_km", data.max_distance_km)
    else:
        items = [data.query]
        max_price = data.max_price
        max_distance = data.max_distance_km

    # Search for each item
    all_results = []
    for item in items:
        query_filter = {"$text": {"$search": item}, "stock_qty": {"$gt": 0}}
        if max_price:
            query_filter["price"] = {"$lte": max_price}

        cursor = products_col.find(query_filter).sort("price", 1).limit(10)
        async for product in cursor:
            # Get vendor distance if location provided
            distance_km = None
            if data.latitude and data.longitude:
                vendor = await vendors_col.find_one({"_id": __import__("bson").ObjectId(product["vendor_id"])})
                if vendor and vendor.get("location"):
                    coords = vendor["location"]["coordinates"]
                    # Simple distance approximation
                    from math import radians, cos, sin, sqrt, atan2
                    R = 6371
                    lat1, lon1 = radians(data.latitude), radians(data.longitude)
                    lat2, lon2 = radians(coords[1]), radians(coords[0])
                    dlat, dlon = lat2 - lat1, lon2 - lon1
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    distance_km = R * 2 * atan2(sqrt(a), sqrt(1-a))

                    if distance_km > max_distance:
                        continue

            product["id"] = str(product["_id"])
            del product["_id"]
            product["distance_km"] = round(distance_km, 1) if distance_km else None
            product["search_term"] = item
            all_results.append(product)

    # Sort by price then distance
    all_results.sort(key=lambda x: (x["price"], x.get("distance_km") or 999))
    return {"results": all_results, "query_parsed": items}
