from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.database import products_col, vendors_col
from app.models import ProductCreate
from app.auth_utils import require_vendor

router = APIRouter()


@router.post("/")
async def create_product(data: ProductCreate, user=Depends(require_vendor)):
    vendor = await vendors_col.find_one({"owner_id": user["sub"]})
    if not vendor:
        raise HTTPException(status_code=404, detail="Register as vendor first")

    product_doc = {
        "vendor_id": str(vendor["_id"]),
        "vendor_name": vendor["shop_name"],
        "name": data.name,
        "category": data.category,
        "price": data.price,
        "stock_qty": data.stock_qty,
        "image_url": data.image_url,
    }
    result = await products_col.insert_one(product_doc)
    return {"id": str(result.inserted_id), "message": "Product created"}


@router.get("/my-products")
async def get_my_products(user=Depends(require_vendor)):
    vendor = await vendors_col.find_one({"owner_id": user["sub"]})
    if not vendor:
        return []
    cursor = products_col.find({"vendor_id": str(vendor["_id"])})
    products = []
    async for p in cursor:
        p["id"] = str(p["_id"])
        del p["_id"]
        products.append(p)
    return products


@router.put("/{product_id}")
async def update_product(product_id: str, data: ProductCreate, user=Depends(require_vendor)):
    vendor = await vendors_col.find_one({"owner_id": user["sub"]})
    product = await products_col.find_one({"_id": ObjectId(product_id), "vendor_id": str(vendor["_id"])})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await products_col.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": data.model_dump(exclude_none=True)},
    )
    return {"message": "Product updated"}


@router.delete("/{product_id}")
async def delete_product(product_id: str, user=Depends(require_vendor)):
    vendor = await vendors_col.find_one({"owner_id": user["sub"]})
    result = await products_col.delete_one({"_id": ObjectId(product_id), "vendor_id": str(vendor["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}


@router.get("/vendor/{vendor_id}")
async def get_vendor_products(vendor_id: str):
    """Get all products for a specific vendor."""
    cursor = products_col.find({"vendor_id": vendor_id, "stock_qty": {"$gt": 0}})
    products = []
    async for p in cursor:
        p["id"] = str(p["_id"])
        del p["_id"]
        products.append(p)
    return products
