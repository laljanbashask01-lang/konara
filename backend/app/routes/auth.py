from fastapi import APIRouter, HTTPException
from app.database import users_col
from app.models import UserRegister, UserLogin, TokenResponse
from app.auth_utils import hash_password, verify_password, create_access_token

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(user: UserRegister):
    existing = await users_col.find_one({"phone": user.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")

    user_doc = {
        "phone": user.phone,
        "name": user.name,
        "password_hash": hash_password(user.password),
        "role": user.role,
    }
    result = await users_col.insert_one(user_doc)
    token = create_access_token({"sub": str(result.inserted_id), "role": user.role, "name": user.name})
    return TokenResponse(access_token=token, role=user.role, name=user.name)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await users_col.find_one({"phone": data.phone})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"], "name": user["name"]})
    return TokenResponse(access_token=token, role=user["role"], name=user["name"])
