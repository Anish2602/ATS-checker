import hashlib
import secrets
from fastapi import Header, HTTPException, status, Depends
from typing import Optional, Dict, Any
from app.services.database import DatabaseService

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hashes a password using SHA-256 with a unique salt."""
        salt = secrets.token_hex(16)
        hash_func = hashlib.sha256()
        hash_func.update((salt + password).encode('utf-8'))
        hashed = hash_func.hexdigest()
        return f"{salt}${hashed}"

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verifies a password against its salt and SHA-256 hash."""
        try:
            salt, original_hash = password_hash.split("$", 1)
            hash_func = hashlib.sha256()
            hash_func.update((salt + password).encode('utf-8'))
            hashed = hash_func.hexdigest()
            return secrets.compare_digest(original_hash, hashed)
        except Exception:
            return False

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency that extracts the session token from the Authorization header,
    validates the session, and returns the current user profile.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header."
        )

    # Allow both 'Bearer <token>' and raw '<token>'
    token = authorization
    if token.startswith("Bearer "):
        token = token[7:]

    session = DatabaseService.get_session(token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid."
        )

    user = DatabaseService.get_user_by_id(session["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )

    return user

async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency that extracts and validates the user session if provided,
    but does not enforce authentication (returns None if not logged in).
    """
    if not authorization:
        return None

    token = authorization
    if token.startswith("Bearer "):
        token = token[7:]

    session = DatabaseService.get_session(token)
    if not session:
        return None

    return DatabaseService.get_user_by_id(session["user_id"])
