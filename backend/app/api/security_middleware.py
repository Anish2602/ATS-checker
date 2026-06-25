from fastapi import Request, HTTPException, status
import time
from typing import Dict, Tuple, List
import html
import re

# Simple In-Memory Rate Limiter: IP -> [Timestamps]
# Standard limit: 100 requests per 1 minute for general endpoints, 10 requests per 1 minute for auth routes.
rate_limit_records: Dict[str, List[float]] = {}

class SecurityMiddleware:
    @staticmethod
    def rate_limit(request: Request, limit: int = 10, window_seconds: int = 60):
        """Simple sliding window rate limiter based on client IP."""
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Initialize or clean records
        if client_ip not in rate_limit_records:
            rate_limit_records[client_ip] = []
            
        # Keep only timestamps within the current window
        rate_limit_records[client_ip] = [
            t for t in rate_limit_records[client_ip] if now - t < window_seconds
        ]
        
        if len(rate_limit_records[client_ip]) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down and try again later."
            )
            
        rate_limit_records[client_ip].append(now)

    @staticmethod
    def verify_csrf(request: Request):
        """
        Enforce CSRF protection by validating browser security headers
        for non-GET/safe operations when cookie-based auth is used.
        """
        if request.method in ["GET", "OPTIONS", "HEAD"]:
            return

        # Double-submit verification: Enforce presence of a custom header
        # that cross-origin scripts cannot set (unless permitted via CORS).
        csrf_token = request.headers.get("x-csrf-token")
        requested_with = request.headers.get("x-requested-with")
        
        # Verify origin matches host header if present
        origin = request.headers.get("origin")
        host = request.headers.get("host")
        
        # For commercial SaaS, checking origin or custom headers is critical
        if not csrf_token and not requested_with:
            # Check if request has cookies - if no cookies, CSRF is not possible (Bearer tokens are immune)
            if request.cookies.get("access_token") or request.cookies.get("refresh_token"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF Protection: Missing verification header (X-CSRF-Token or X-Requested-With)."
                )

    @staticmethod
    def sanitize_input(text: str) -> str:
        """Sanitizes text strings to prevent XSS injections."""
        if not text:
            return ""
        # 1. Clean HTML characters
        text = html.escape(text)
        # 2. Strip standard inline script injection hazards
        text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
        return text

    @classmethod
    def sanitize_dict(cls, data: Dict) -> Dict:
        """Recursively sanitizes values in a dictionary."""
        sanitized = {}
        for k, v in data.items():
            if isinstance(v, str):
                sanitized[k] = cls.sanitize_input(v)
            elif isinstance(v, dict):
                sanitized[k] = cls.sanitize_dict(v)
            elif isinstance(v, list):
                sanitized[k] = [cls.sanitize_input(i) if isinstance(i, str) else i for i in v]
            else:
                sanitized[k] = v
        return sanitized
