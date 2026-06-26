from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class Role(str, Enum):
    customer = "customer"
    vendor = "vendor"
    delivery = "delivery"
    admin = "admin"


class OrderStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    preparing = "preparing"
    ready = "ready"
    agent_assigned = "agent_assigned"
    picked_up = "picked_up"
    on_the_way = "on_the_way"
    delivered = "delivered"
    rejected = "rejected"


# --- Auth Models ---
class UserRegister(BaseModel):
    phone: str
    password: str
    name: str
    role: Role = Role.customer


class UserLogin(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


# --- Vendor Models ---
class VendorCreate(BaseModel):
    shop_name: str
    category: str
    latitude: float
    longitude: float
    delivery_radius_km: float = 5.0


class VendorResponse(BaseModel):
    id: str
    shop_name: str
    category: str
    location: dict
    delivery_radius_km: float
    is_open: bool


# --- Product Models ---
class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    stock_qty: int
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    vendor_id: str
    vendor_name: str
    name: str
    category: str
    price: float
    stock_qty: int
    image_url: Optional[str] = None
    distance_km: Optional[float] = None


# --- Order Models ---
class OrderItem(BaseModel):
    product_id: str
    name: str
    qty: int
    price: float


class SubOrder(BaseModel):
    vendor_id: str
    vendor_name: str
    items: List[OrderItem]
    status: OrderStatus = OrderStatus.pending
    total: float


class OrderCreate(BaseModel):
    items: List[dict]  # [{product_id, qty}]
    latitude: float
    longitude: float


# --- Search Models ---
class SearchQuery(BaseModel):
    query: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_distance_km: float = 5.0
    max_price: Optional[float] = None
