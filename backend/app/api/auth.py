"""
Feature: User Authentication.

POST /api/auth/register  — create an account with username + password
POST /api/auth/login     — log in, get a JWT token back
GET  /api/auth/me        — check who's currently logged in (using the token)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator

from app.services import auth_service, user_service
from app.dependencies import get_current_user

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str
    password: str

    @field_validator("username", "password")
    @classmethod
    def not_blank(cls, value: str, info):
        cleaned = value.strip()
        if not cleaned:
            raise ValueError(f"'{info.field_name}' cannot be empty.")
        if info.field_name == "password" and len(cleaned) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return cleaned


@router.post("/register")
def register(request: RegisterRequest):
    existing = user_service.get_user_by_username(request.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username is already taken.")

    password_hash = auth_service.hash_password(request.password)
    user = user_service.create_user(request.username, password_hash)

    token = auth_service.create_access_token(user["id"], user["username"])
    return {"access_token": token, "username": user["username"], "role": user.get("role", "team_lead")}


@router.post("/login")
def login(request: RegisterRequest):
    user = user_service.get_user_by_username(request.username)

    if user is None:
        raise HTTPException(status_code=401, detail="Incorrect username or password.")

    if not auth_service.verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password.")

    token = auth_service.create_access_token(user["id"], user["username"])
    return {"access_token": token, "username": user["username"], "role": user.get("role", "team_lead")}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


class RoleUpdateRequest(BaseModel):
    role: str


@router.patch("/role")
def update_role(request: RoleUpdateRequest, current_user: dict = Depends(get_current_user)):
    target_role = request.role.strip().lower()
    if target_role not in ("developer", "team_lead", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'developer', 'team_lead', or 'admin'.")
    new_role = user_service.update_user_role(current_user["id"], target_role)
    return {"id": current_user["id"], "username": current_user["username"], "role": new_role}