"""
Feature: User Authentication (JWT).

This file handles two separate concerns:
1. Password hashing (bcrypt) — we NEVER store plain-text passwords.
2. JWT tokens — after login, the user gets a signed "ticket" (token) that
   proves who they are on every future request, without needing to send
   their password again.
"""

import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import settings

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # tokens stay valid for 7 days


def hash_password(password: str) -> str:
    """Turns a plain-text password into a secure hash to store in the database."""
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Checks a login attempt's password against the stored hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: int, username: str) -> str:
    """
    Creates a signed JWT containing the user's id and username.
    The signature (using JWT_SECRET) proves this token wasn't tampered with.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Verifies a token's signature and expiry, and returns its contents.
    Raises JWTError if the token is invalid, tampered with, or expired.
    """
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[JWT_ALGORITHM])