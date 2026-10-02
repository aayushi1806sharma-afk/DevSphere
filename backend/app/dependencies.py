"""
FastAPI "dependency" that any protected endpoint can use to require login.

Usage in an endpoint:
    @router.get("/something")
    def my_endpoint(current_user: dict = Depends(get_current_user)):
        # current_user = {"id": 1, "username": "kanak"}
"""

from fastapi import Header, HTTPException
from jose import JWTError
from app.services import auth_service, user_service


def get_current_user(authorization: str = Header(None)) -> dict:
    """
    Reads the "Authorization: Bearer <token>" header, verifies the JWT,
    and returns the logged-in user's info. Raises 401 if missing/invalid.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")

    token = authorization.replace("Bearer ", "", 1)

    try:
        payload = auth_service.decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")

    user_id = int(payload.get("sub"))
    user = user_service.get_user_by_id(user_id)

    if user is None:
        raise HTTPException(status_code=401, detail="User no longer exists.")

    return user


def require_team_lead_or_admin(authorization: str = Header(None)) -> dict:
    """
    Role-based access dependency for Module 4 (FR-5).
    Guarantees that only users with 'team_lead' or 'admin' role
    can view or query the team analytics endpoints.
    """
    user = get_current_user(authorization)
    role = str(user.get("role", "developer")).strip().lower()

    if role not in ("team_lead", "admin", "lead"):
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: This dashboard is restricted to Team Lead and Admin roles only.",
        )

    return user