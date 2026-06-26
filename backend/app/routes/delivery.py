"""
Delivery Agent routes — assignment, pickup, tracking, delivery.
Flow: Order ready → Agent assigned → Picks up from vendor(s) → Delivers to customer
"""
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from app.database import orders_col, vendors_col, users_col
from app.auth_utils import get_current_user, decode_token

router = APIRouter()


async def require_delivery(user=Depends(get_current_user)):
    if user.get("role") != "delivery":
        raise HTTPException(status_code=403, detail="Delivery agent access required")
    return user


@router.get("/available-orders")
async def get_available_orders(user=Depends(require_delivery)):
    """Get orders that are ready for pickup (all sub-orders are 'ready')."""
    cursor = orders_col.find({
        "delivery_agent_id": None,
        "sub_orders.status": "ready",
    }).sort("created_at", -1)

    available = []
    async for order in cursor:
        # Check if ALL sub-orders are ready
        all_ready = all(sub["status"] == "ready" for sub in order["sub_orders"])
        if all_ready:
            order["id"] = str(order["_id"])
            del order["_id"]
            available.append(order)
    return available


@router.post("/accept/{order_id}")
async def accept_order(order_id: str, user=Depends(require_delivery)):
    """Delivery agent accepts an order for delivery."""
    order = await orders_col.find_one({"_id": ObjectId(order_id), "delivery_agent_id": None})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or already assigned")

    await orders_col.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "delivery_agent_id": user["sub"],
            "delivery_agent_name": user["name"],
            "delivery_status": "agent_assigned",
            "assigned_at": datetime.utcnow(),
            "sub_orders.$[].status": "agent_assigned",
        }}
    )
    return {"message": "Order accepted for delivery", "order_id": order_id}


@router.get("/my-deliveries")
async def get_my_deliveries(user=Depends(require_delivery)):
    """Get all orders assigned to this delivery agent."""
    cursor = orders_col.find({"delivery_agent_id": user["sub"]}).sort("assigned_at", -1)
    deliveries = []
    async for order in cursor:
        order["id"] = str(order["_id"])
        del order["_id"]
        deliveries.append(order)
    return deliveries


@router.patch("/update-status/{order_id}")
async def update_delivery_status(order_id: str, status: str, user=Depends(require_delivery)):
    """
    Agent updates delivery status:
    agent_assigned → picked_up → on_the_way → delivered
    """
    valid_transitions = ["picked_up", "on_the_way", "delivered"]
    if status not in valid_transitions:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {valid_transitions}")

    order = await orders_col.find_one({"_id": ObjectId(order_id), "delivery_agent_id": user["sub"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update = {
        "delivery_status": status,
        "sub_orders.$[].status": status,
    }
    if status == "picked_up":
        update["picked_up_at"] = datetime.utcnow()
    elif status == "delivered":
        update["delivered_at"] = datetime.utcnow()

    await orders_col.update_one({"_id": ObjectId(order_id)}, {"$set": update})
    return {"message": f"Status updated to {status}"}


@router.get("/order-route/{order_id}")
async def get_delivery_route(order_id: str, user=Depends(require_delivery)):
    """Get pickup points (vendor locations) and delivery point (customer location)."""
    order = await orders_col.find_one({"_id": ObjectId(order_id), "delivery_agent_id": user["sub"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Get vendor locations for each sub-order
    pickup_points = []
    for sub in order["sub_orders"]:
        vendor = await vendors_col.find_one({"_id": ObjectId(sub["vendor_id"])})
        if vendor:
            pickup_points.append({
                "vendor_name": sub["vendor_name"],
                "location": vendor.get("location"),
                "items_count": len(sub["items"]),
            })

    return {
        "order_id": order_id,
        "pickup_points": pickup_points,
        "delivery_location": order.get("location"),
        "total_stops": len(pickup_points) + 1,
    }
