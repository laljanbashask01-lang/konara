from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from app.database import orders_col, products_col, vendors_col
from app.models import OrderCreate, OrderStatus
from app.auth_utils import get_current_user, require_vendor

router = APIRouter()


@router.post("/")
async def create_order(data: OrderCreate, user=Depends(get_current_user)):
    # Group items by vendor
    vendor_items = {}
    for item in data.items:
        product = await products_col.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            continue
        if product["stock_qty"] < item["qty"]:
            raise HTTPException(status_code=400, detail=f"{product['name']} out of stock")

        vid = product["vendor_id"]
        if vid not in vendor_items:
            vendor = await vendors_col.find_one({"_id": ObjectId(vid)})
            vendor_items[vid] = {"vendor_name": vendor["shop_name"], "items": [], "total": 0}

        vendor_items[vid]["items"].append({
            "product_id": item["product_id"],
            "name": product["name"],
            "qty": item["qty"],
            "price": product["price"],
        })
        vendor_items[vid]["total"] += product["price"] * item["qty"]

        # Deduct stock
        await products_col.find_one_and_update(
            {"_id": ObjectId(item["product_id"]), "stock_qty": {"$gte": item["qty"]}},
            {"$inc": {"stock_qty": -item["qty"]}},
        )

    sub_orders = [
        {"vendor_id": vid, "vendor_name": v["vendor_name"], "items": v["items"],
         "status": "pending", "total": v["total"]}
        for vid, v in vendor_items.items()
    ]

    order_doc = {
        "customer_id": user["sub"],
        "sub_orders": sub_orders,
        "location": {"type": "Point", "coordinates": [data.longitude, data.latitude]},
        "delivery_agent_id": None,
        "delivery_agent_name": None,
        "delivery_status": "pending",
        "created_at": datetime.utcnow(),
    }
    result = await orders_col.insert_one(order_doc)
    return {"order_id": str(result.inserted_id), "sub_orders": len(sub_orders)}


@router.get("/my-orders")
async def get_my_orders(user=Depends(get_current_user)):
    cursor = orders_col.find({"customer_id": user["sub"]}).sort("created_at", -1)
    orders = []
    async for o in cursor:
        o["id"] = str(o["_id"])
        del o["_id"]
        orders.append(o)
    return orders


@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, vendor_id: str, status: OrderStatus, user=Depends(require_vendor)):
    vendor = await vendors_col.find_one({"owner_id": user["sub"]})
    result = await orders_col.update_one(
        {"_id": ObjectId(order_id), "sub_orders.vendor_id": str(vendor["_id"])},
        {"$set": {"sub_orders.$.status": status}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": f"Status updated to {status}"}


@router.get("/vendor-orders")
async def get_vendor_orders(user=Depends(require_vendor)):
    """Get orders assigned to this vendor."""
    vendor = await vendors_col.find_one({"owner_id": user["sub"]})
    if not vendor:
        return []

    vendor_id = str(vendor["_id"])
    cursor = orders_col.find({"sub_orders.vendor_id": vendor_id}).sort("created_at", -1)

    vendor_orders = []
    async for order in cursor:
        for sub in order["sub_orders"]:
            if sub["vendor_id"] == vendor_id:
                vendor_orders.append({
                    "order_id": str(order["_id"]),
                    "vendor_id": vendor_id,
                    "items": sub["items"],
                    "status": sub["status"],
                    "total": sub["total"],
                    "created_at": order["created_at"],
                })
    return vendor_orders
