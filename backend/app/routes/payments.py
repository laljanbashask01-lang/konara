"""
Payment routes — Model 2: App collects, deducts commission, settles to vendor.
Uses Razorpay (mock mode if no keys configured).

Flow:
1. Customer clicks "Pay" → backend creates Razorpay order
2. Frontend opens Razorpay checkout
3. On success → backend verifies payment → marks order as paid
4. After delivery → platform settles to vendor (minus commission)
"""
import os
import hashlib
import hmac
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.database import orders_col, vendors_col
from app.auth_utils import get_current_user

router = APIRouter()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
PLATFORM_COMMISSION_PERCENT = 10  # Konara takes 10%
DELIVERY_FEE = 30  # Fixed ₹30 delivery fee

USE_MOCK = not RAZORPAY_KEY_ID  # Mock mode if no keys


@router.post("/create-order/{order_id}")
async def create_payment_order(order_id: str, user=Depends(get_current_user)):
    """Create a Razorpay payment order for the given order."""
    order = await orders_col.find_one({"_id": ObjectId(order_id), "customer_id": user["sub"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Already paid")

    # Calculate totals
    subtotal = sum(sub["total"] for sub in order["sub_orders"])
    commission = round(subtotal * PLATFORM_COMMISSION_PERCENT / 100, 2)
    total_amount = subtotal + DELIVERY_FEE

    if USE_MOCK:
        # Mock payment order
        payment_order_id = f"mock_order_{order_id}"
        await orders_col.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {
                "payment_order_id": payment_order_id,
                "subtotal": subtotal,
                "delivery_fee": DELIVERY_FEE,
                "platform_commission": commission,
                "total_amount": total_amount,
            }}
        )
        return {
            "order_id": payment_order_id,
            "amount": int(total_amount * 100),  # paise
            "currency": "INR",
            "key_id": "mock_key",
            "mock_mode": True,
            "breakdown": {
                "subtotal": subtotal,
                "delivery_fee": DELIVERY_FEE,
                "platform_fee": commission,
                "total": total_amount,
            }
        }
    else:
        # Real Razorpay order
        import httpx
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.post(
                "https://api.razorpay.com/v1/orders",
                json={
                    "amount": int(total_amount * 100),
                    "currency": "INR",
                    "receipt": order_id,
                },
                auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            )
            resp.raise_for_status()
            rz_order = resp.json()

        await orders_col.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {
                "payment_order_id": rz_order["id"],
                "subtotal": subtotal,
                "delivery_fee": DELIVERY_FEE,
                "platform_commission": commission,
                "total_amount": total_amount,
            }}
        )
        return {
            "order_id": rz_order["id"],
            "amount": rz_order["amount"],
            "currency": rz_order["currency"],
            "key_id": RAZORPAY_KEY_ID,
            "mock_mode": False,
            "breakdown": {
                "subtotal": subtotal,
                "delivery_fee": DELIVERY_FEE,
                "platform_fee": commission,
                "total": total_amount,
            }
        }


@router.post("/verify/{order_id}")
async def verify_payment(order_id: str, body: dict, user=Depends(get_current_user)):
    """Verify payment after Razorpay callback."""
    order = await orders_col.find_one({"_id": ObjectId(order_id), "customer_id": user["sub"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if USE_MOCK:
        # Mock: always succeed
        await orders_col.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {
                "payment_status": "paid",
                "payment_id": f"mock_pay_{order_id}",
                "paid_at": datetime.utcnow(),
            }}
        )
        return {"status": "success", "message": "Payment verified (mock mode)"}
    else:
        # Verify Razorpay signature
        razorpay_order_id = body.get("razorpay_order_id")
        razorpay_payment_id = body.get("razorpay_payment_id")
        razorpay_signature = body.get("razorpay_signature")

        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_sig = hmac.new(
            RAZORPAY_KEY_SECRET.encode(), message.encode(), hashlib.sha256
        ).hexdigest()

        if expected_sig != razorpay_signature:
            raise HTTPException(status_code=400, detail="Payment verification failed")

        await orders_col.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {
                "payment_status": "paid",
                "payment_id": razorpay_payment_id,
                "paid_at": datetime.utcnow(),
            }}
        )
        return {"status": "success", "message": "Payment verified"}


@router.get("/settlement/{order_id}")
async def get_settlement_info(order_id: str, user=Depends(get_current_user)):
    """Show how the payment will be split between vendors and platform."""
    order = await orders_col.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    settlements = []
    for sub in order["sub_orders"]:
        vendor_amount = sub["total"] - (sub["total"] * PLATFORM_COMMISSION_PERCENT / 100)
        settlements.append({
            "vendor_name": sub["vendor_name"],
            "order_amount": sub["total"],
            "commission_deducted": round(sub["total"] * PLATFORM_COMMISSION_PERCENT / 100, 2),
            "vendor_receives": round(vendor_amount, 2),
            "status": "settled" if order.get("delivery_status") == "delivered" else "pending",
        })

    return {
        "order_id": order_id,
        "total_collected": order.get("total_amount", 0),
        "platform_commission": order.get("platform_commission", 0),
        "delivery_fee": order.get("delivery_fee", 0),
        "vendor_settlements": settlements,
    }
