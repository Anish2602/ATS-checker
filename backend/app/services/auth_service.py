import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))
except ImportError:
    pass

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-use-a-64-char-random-hex")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() == "production"


class AuthService:

    # -------------------------------------------------------------------------
    # Password Hashing
    # -------------------------------------------------------------------------

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False

    @staticmethod
    def validate_password_strength(password: str) -> Optional[str]:
        if len(password) < 8:
            return "Password must be at least 8 characters."
        if not any(c.isdigit() for c in password):
            return "Password must contain at least one number."
        if not any(c.isupper() for c in password):
            return "Password must contain at least one uppercase letter."
        if not any(c.islower() for c in password):
            return "Password must contain at least one lowercase letter."
        return None

    # -------------------------------------------------------------------------
    # JWT Tokens
    # -------------------------------------------------------------------------

    @staticmethod
    def create_access_token(user_id: str) -> str:
        payload = {
            "sub": user_id,
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            "iat": datetime.utcnow(),
            "type": "access",
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def verify_access_token(token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("type") != "access":
                return None
            return payload.get("sub")
        except jwt.ExpiredSignatureError:
            return None
        except jwt.PyJWTError:
            return None

    # -------------------------------------------------------------------------
    # Google OAuth — uses google-auth library in production, tokeninfo fallback
    # -------------------------------------------------------------------------

    @staticmethod
    def verify_google_token(id_token: str) -> Optional[Dict[str, Any]]:
        # Development mock — prefix with "mock_google_<email>"
        if id_token.startswith("mock_google_"):
            mock_email = id_token.replace("mock_google_", "")
            if not mock_email or "@" not in mock_email:
                return None
            return {
                "sub": f"mock_g_{mock_email}",
                "email": mock_email,
                "first_name": "Google",
                "last_name": "User",
                "full_name": "Google User",
                "profile_picture": "",
            }

        # Production — verify with google-auth library
        if GOOGLE_CLIENT_ID:
            try:
                from google.oauth2 import id_token as google_id_token
                from google.auth.transport import requests as google_requests
                idinfo = google_id_token.verify_oauth2_token(
                    id_token,
                    google_requests.Request(),
                    GOOGLE_CLIENT_ID,
                )
                if idinfo.get("aud") != GOOGLE_CLIENT_ID:
                    return None
                first_name = idinfo.get("given_name", "")
                last_name = idinfo.get("family_name", "")
                return {
                    "sub": idinfo["sub"],
                    "email": idinfo["email"],
                    "first_name": first_name,
                    "last_name": last_name,
                    "full_name": idinfo.get("name", f"{first_name} {last_name}").strip(),
                    "profile_picture": idinfo.get("picture", ""),
                }
            except Exception:
                return None

        # Fallback — Google tokeninfo endpoint (no client validation)
        try:
            import requests
            resp = requests.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}",
                timeout=5,
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            first_name = data.get("given_name", "")
            last_name = data.get("family_name", "")
            return {
                "sub": data.get("sub"),
                "email": data.get("email"),
                "first_name": first_name,
                "last_name": last_name,
                "full_name": data.get("name", f"{first_name} {last_name}").strip(),
                "profile_picture": data.get("picture", ""),
            }
        except Exception:
            return None

    # -------------------------------------------------------------------------
    # Apple Sign-In
    # -------------------------------------------------------------------------

    @staticmethod
    def verify_apple_token(
        identity_token: str, full_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        if identity_token.startswith("mock_apple_"):
            mock_email = identity_token.replace("mock_apple_", "")
            if not mock_email or "@" not in mock_email:
                return None
            parts = (full_name or "Apple User").split(" ", 1)
            return {
                "sub": f"mock_ap_{mock_email}",
                "email": mock_email,
                "first_name": parts[0],
                "last_name": parts[1] if len(parts) > 1 else "",
                "full_name": full_name or "Apple User",
                "profile_picture": "",
            }

        try:
            claims = jwt.decode(identity_token, options={"verify_signature": False})
            exp = claims.get("exp")
            if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
                return None
            first_name, last_name = "", ""
            if full_name:
                parts = full_name.split(" ", 1)
                first_name = parts[0]
                last_name = parts[1] if len(parts) > 1 else ""
            return {
                "sub": claims.get("sub"),
                "email": claims.get("email"),
                "first_name": first_name,
                "last_name": last_name,
                "full_name": full_name or "",
                "profile_picture": "",
            }
        except Exception:
            return None
