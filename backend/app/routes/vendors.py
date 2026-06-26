from fastapi import APIRouter, Depends, HTTPException
from app.database import vendors_col
from app.models import VendorCreate, VendorResponse
from app.auth_utils import require_vendor, get_current_user

router = APIRouter()


@router.post("/register")
async def register_vendor(data: VendorCreate, user=Depends(require_vendor)):
    existing = await vendors_col.find_one({"owner_id": user["sub"]})
    if existing:
        raise HTTPException(status_code=400, detail="Vendor already registered")

    vendor_doc = {
        "owner_id": user["sub"],
        "shop_name": data.shop_name,
        "category": data.category,
        "location": {"type": "Point", "coordinates": [data.longitude, data.latitude]},
        "delivery_radius_km": data.delivery_radius_km,
        "is_open": True,
    }
    await vendors_col.insert_one(vendor_doc)
    return {"message": "Vendor registered successfully"}


@router.get("/me")
async def get_my_vendor(user=Depends(require_vendor)):
    vendor = await vendors_col.find_one({"owner_id": user["sub"]})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    vendor["id"] = str(vendor["_id"])
    return vendor


@router.patch("/toggle-open")
async def toggle_open(user=Depends(require_vendor)):
    vendor = await vendors_col.find_one({"owner_id": user["sub"]})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    new_status = not vendor.get("is_open", True)
    await vendors_col.update_one({"_id": vendor["_id"]}, {"$set": {"is_open": new_status}})
    return {"is_open": new_status}


@router.get("/nearby")
async def get_nearby_vendors(lat: float, lng: float, radius_km: float = 5):
    cursor = vendors_col.find({
        "location": {
            "$nearSphere": {
                "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                "$maxDistance": radius_km * 1000,
            }
        },
        "is_open": True,
    })
    vendors = []
    async for v in cursor:
        v["id"] = str(v["_id"])
        del v["_id"]
        vendors.append(v)
    return vendors


@router.get("/{vendor_id}")
async def get_vendor(vendor_id: str):
    from bson import ObjectId
    vendor = await vendors_col.find_one({"_id": ObjectId(vendor_id)})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor["id"] = str(vendor["_id"])
    del vendor["_id"]
    return vendor
