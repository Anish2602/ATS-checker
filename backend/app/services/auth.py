from fastapi import Header, HTTPException, status, Depends, Request
from typing import Optional, Dict, Any
from app.services.database import DatabaseService
from app.services.auth_service import AuthService

async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency that extracts the JWT access token from the Authorization header or cookies,
    validates the JWT, and returns the current user profile. Enforces email verification.
    """
    token = None
    
    # 1. Try extracting from Authorization header
    if authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization
            
    # 2. Try extracting from Cookie if header is absent
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please sign in."
        )

    user_id = AuthService.verify_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token is invalid or has expired."
        )

    user = DatabaseService.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token does not exist."
        )

    # Enforce email verification (block action if unverified)
    if not user.get("email_verified", 0):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "EMAIL_UNVERIFIED",
                "user_id": user["id"],
                "email": user["email"],
                "message": "Please verify your email address to access this resource."
            }
        )

    return user

async def get_optional_user(request: Request, authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency that extracts and validates the user JWT if provided,
    but does not enforce authentication (returns None if not logged in).
    """
    token = None
    if authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        return None

    user_id = AuthService.verify_access_token(token)
    if not user_id:
        return None

    return DatabaseService.get_user_by_id(user_id)
