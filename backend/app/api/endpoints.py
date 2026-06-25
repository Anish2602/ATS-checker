import re
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status, Request, Response
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from app.services.parser import ResumeParserService
from app.services.scoring import ScoringEngineService
from app.services.llm_optimizer import LLMOptimizerService
from app.services.database import DatabaseService
from app.services.auth_service import AuthService
from app.services.auth import get_current_user, get_optional_user
from app.services.email_service import EmailService
from app.api.security_middleware import SecurityMiddleware

IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() == "production"
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

router = APIRouter(prefix="/api/v1")


# =============================================================================
# Pydantic Schemas
# =============================================================================

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    credential: str  # Google Identity Services JWT

class AppleAuthRequest(BaseModel):
    identity_token: str
    full_name: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_picture: Optional[str] = None

class BulletRewriteRequest(BaseModel):
    original_text: str
    target_role: str
    target_company: Optional[str] = ""


# =============================================================================
# Cookie Helpers
# =============================================================================

def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"

def _user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "unknown")

def _set_auth_cookies(response: Response, user_id: str, request: Request) -> str:
    """Create access + refresh tokens and set secure httpOnly cookies."""
    access_token = AuthService.create_access_token(user_id)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=15 * 60,
        samesite="lax",
        secure=IS_PRODUCTION,
    )

    refresh_token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    DatabaseService.revoke_all_user_sessions(user_id)
    DatabaseService.create_user_session(
        user_id, refresh_token, expires_at, _client_ip(request), _user_agent(request)
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=IS_PRODUCTION,
        path="/api/v1/auth",
    )
    return access_token

def _clear_auth_cookies(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token", path="/api/v1/auth")

def _user_response(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user.get("full_name") or f"{user.get('first_name','') or ''} {user.get('last_name','') or ''}".strip(),
        "first_name": user.get("first_name") or "",
        "last_name": user.get("last_name") or "",
        "profile_picture": user.get("profile_picture") or "",
        "auth_provider": user.get("auth_provider", "email"),
        "subscription_plan": user.get("subscription_plan") or "Free",
        "ats_credits": user.get("ats_credits") or 0,
    }


# =============================================================================
# Auth Endpoints
# =============================================================================

@router.post("/auth/signup", status_code=201)
async def signup(payload: SignupRequest, request: Request):
    SecurityMiddleware.rate_limit(request, limit=5, window_seconds=60)

    email = payload.email.strip().lower()
    password = payload.password

    # Parse name
    full_name = payload.full_name.strip()
    first_name = payload.first_name or (full_name.split()[0] if full_name else "")
    last_name = payload.last_name or (" ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else "")

    if DatabaseService.get_user_by_email(email):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    pwd_err = AuthService.validate_password_strength(password)
    if pwd_err:
        raise HTTPException(status_code=422, detail=pwd_err)

    pwd_hash = AuthService.hash_password(password)
    user_id = DatabaseService.create_user(
        email=email,
        password_hash=pwd_hash,
        full_name=full_name,
        first_name=first_name,
        last_name=last_name,
        auth_provider="email",
        email_verified=0,
    )

    token = DatabaseService.create_verification_token(user_id)
    EmailService.send_verification_email(email, first_name or full_name, token)
    DatabaseService.log_audit(user_id, "user_signup", f"Email signup: {email}", _client_ip(request))

    return {
        "status": "success",
        "message": "Account created! Please check your inbox and verify your email before signing in.",
    }


@router.post("/auth/login")
async def login(payload: LoginRequest, request: Request, response: Response):
    SecurityMiddleware.rate_limit(request, limit=10, window_seconds=60)

    email = payload.email.strip().lower()
    user = DatabaseService.get_user_by_email(email)

    if not user or not user.get("password_hash") or not AuthService.verify_password(payload.password, user["password_hash"]):
        if user:
            DatabaseService.log_login(user["id"], _client_ip(request), _user_agent(request), "failed")
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.get("email_verified"):
        DatabaseService.log_login(user["id"], _client_ip(request), _user_agent(request), "unverified")
        raise HTTPException(
            status_code=403,
            detail={
                "code": "EMAIL_UNVERIFIED",
                "email": user["email"],
                "message": "Please verify your email address before signing in.",
            },
        )

    _set_auth_cookies(response, user["id"], request)
    DatabaseService.update_last_login(user["id"])
    DatabaseService.log_login(user["id"], _client_ip(request), _user_agent(request), "success")
    DatabaseService.log_audit(user["id"], "user_login", "Email login success.", _client_ip(request))

    return {"status": "success", "user": _user_response(user)}


@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        DatabaseService.revoke_user_session(refresh_token)
    _clear_auth_cookies(response)
    return {"status": "success", "message": "Signed out successfully."}


@router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    rt = request.cookies.get("refresh_token")
    if not rt:
        raise HTTPException(status_code=401, detail="No refresh token found.")

    session = DatabaseService.get_user_session(rt)
    if not session:
        raise HTTPException(status_code=401, detail="Session is invalid or revoked.")

    if datetime.fromisoformat(session["expires_at"]) < datetime.utcnow():
        DatabaseService.revoke_user_session(rt)
        raise HTTPException(status_code=401, detail="Session has expired. Please sign in again.")

    access_token = _set_auth_cookies(response, session["user_id"], request)
    return {"status": "success", "access_token": access_token}


@router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return _user_response(current_user)


@router.get("/auth/session")
async def get_session(request: Request, response: Response):
    """Validate current cookie session and return user. Tries refresh if access token is expired."""
    token = request.cookies.get("access_token")
    if token:
        user_id = AuthService.verify_access_token(token)
        if user_id:
            user = DatabaseService.get_user_by_id(user_id)
            if user:
                return {"status": "authenticated", "user": _user_response(user)}

    # Try refresh
    rt = request.cookies.get("refresh_token")
    if not rt:
        raise HTTPException(status_code=401, detail="No active session.")

    session = DatabaseService.get_user_session(rt)
    if not session or datetime.fromisoformat(session["expires_at"]) < datetime.utcnow():
        if session:
            DatabaseService.revoke_user_session(rt)
        raise HTTPException(status_code=401, detail="Session expired.")

    _set_auth_cookies(response, session["user_id"], request)
    user = DatabaseService.get_user_by_id(session["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    return {"status": "authenticated", "user": _user_response(user)}


@router.post("/auth/google")
async def google_auth(payload: GoogleAuthRequest, request: Request, response: Response):
    SecurityMiddleware.rate_limit(request, limit=10, window_seconds=60)

    profile = AuthService.verify_google_token(payload.credential)
    if not profile:
        raise HTTPException(status_code=400, detail="Google authentication failed. Invalid token.")

    email = profile["email"].lower().strip()
    google_id = profile["sub"]

    # Check by Google provider ID first (most reliable)
    user = DatabaseService.get_user_by_provider("google", google_id)

    if not user:
        user = DatabaseService.get_user_by_email(email)

    if not user:
        # New user — create account
        user_id = DatabaseService.create_user(
            email=email,
            full_name=profile.get("full_name", ""),
            first_name=profile.get("first_name", ""),
            last_name=profile.get("last_name", ""),
            profile_picture=profile.get("profile_picture", ""),
            auth_provider="google",
            provider_user_id=google_id,
            email_verified=1,
        )
        DatabaseService.create_oauth_account(user_id, "google", google_id)
        DatabaseService.log_audit(user_id, "user_signup_google", f"Google OAuth signup: {email}", _client_ip(request))
        user = DatabaseService.get_user_by_id(user_id)
    else:
        # Existing user — link Google account if not linked
        DatabaseService.create_oauth_account(user["id"], "google", google_id)
        if not user.get("email_verified"):
            DatabaseService.verify_user_email(user["id"])
        user = DatabaseService.get_user_by_id(user["id"])

    _set_auth_cookies(response, user["id"], request)
    DatabaseService.update_last_login(user["id"])
    DatabaseService.log_login(user["id"], _client_ip(request), _user_agent(request), "success_google")

    return {"status": "success", "user": _user_response(user)}


@router.post("/auth/apple")
async def apple_auth(payload: AppleAuthRequest, request: Request, response: Response):
    SecurityMiddleware.rate_limit(request, limit=10, window_seconds=60)

    profile = AuthService.verify_apple_token(payload.identity_token, payload.full_name)
    if not profile:
        raise HTTPException(status_code=400, detail="Apple Sign-In failed. Invalid token.")

    email = profile["email"].lower().strip()
    apple_id = profile["sub"]

    user = DatabaseService.get_user_by_provider("apple", apple_id)
    if not user:
        user = DatabaseService.get_user_by_email(email)

    if not user:
        user_id = DatabaseService.create_user(
            email=email,
            full_name=profile.get("full_name", ""),
            first_name=profile.get("first_name", ""),
            last_name=profile.get("last_name", ""),
            auth_provider="apple",
            provider_user_id=apple_id,
            email_verified=1,
        )
        DatabaseService.create_oauth_account(user_id, "apple", apple_id)
        DatabaseService.log_audit(user_id, "user_signup_apple", f"Apple OAuth signup: {email}", _client_ip(request))
        user = DatabaseService.get_user_by_id(user_id)
    else:
        DatabaseService.create_oauth_account(user["id"], "apple", apple_id)
        if not user.get("email_verified"):
            DatabaseService.verify_user_email(user["id"])
        user = DatabaseService.get_user_by_id(user["id"])

    _set_auth_cookies(response, user["id"], request)
    DatabaseService.update_last_login(user["id"])

    return {"status": "success", "user": _user_response(user)}


@router.post("/auth/verify-email")
async def verify_email(payload: VerifyEmailRequest, request: Request):
    token = payload.token.strip()

    record = DatabaseService.get_verification_token(token)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

    if datetime.fromisoformat(record["expires_at"]) < datetime.utcnow():
        DatabaseService.delete_verification_token(token)
        raise HTTPException(status_code=400, detail="This verification link has expired. Request a new one.")

    DatabaseService.verify_user_email(record["user_id"])
    DatabaseService.delete_verification_token(token)
    DatabaseService.log_audit(record["user_id"], "email_verified", "Email address verified.", _client_ip(request))

    return {"status": "success", "message": "Email verified successfully. You can now sign in."}


@router.post("/auth/resend-verification")
async def resend_verification(payload: ResendVerificationRequest, request: Request):
    SecurityMiddleware.rate_limit(request, limit=3, window_seconds=60)

    email = payload.email.strip().lower()
    user = DatabaseService.get_user_by_email(email)

    if user and not user.get("email_verified") and user.get("auth_provider") == "email":
        token = DatabaseService.create_verification_token(user["id"])
        EmailService.send_verification_email(email, user.get("first_name") or "User", token)
        DatabaseService.log_audit(user["id"], "resend_verification", "Resent verification email.", _client_ip(request))

    # Always return success to prevent email enumeration
    return {
        "status": "success",
        "message": "If this email belongs to an unverified account, a new verification link has been sent.",
    }


@router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, request: Request):
    SecurityMiddleware.rate_limit(request, limit=3, window_seconds=60)

    email = payload.email.strip().lower()
    user = DatabaseService.get_user_by_email(email)

    if user and user.get("auth_provider") == "email":
        token = DatabaseService.create_password_reset_token(user["id"])
        EmailService.send_password_reset_email(email, user.get("first_name") or "User", token)
        DatabaseService.log_audit(user["id"], "forgot_password", "Password reset token sent.", _client_ip(request))

    return {
        "status": "success",
        "message": "If an account with that email exists, a reset link has been sent.",
    }


@router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest, request: Request):
    SecurityMiddleware.rate_limit(request, limit=3, window_seconds=60)

    record = DatabaseService.get_password_reset_token(payload.token.strip())
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if datetime.fromisoformat(record["expires_at"]) < datetime.utcnow():
        DatabaseService.delete_password_reset_token(payload.token)
        raise HTTPException(status_code=400, detail="This reset link has expired.")

    pwd_err = AuthService.validate_password_strength(payload.new_password)
    if pwd_err:
        raise HTTPException(status_code=422, detail=pwd_err)

    pwd_hash = AuthService.hash_password(payload.new_password)
    DatabaseService.update_password(record["user_id"], pwd_hash)
    DatabaseService.delete_password_reset_token(payload.token)
    DatabaseService.revoke_all_user_sessions(record["user_id"])
    DatabaseService.log_audit(record["user_id"], "password_reset", "Password reset via token.", _client_ip(request))

    return {"status": "success", "message": "Password updated. You can now sign in with your new password."}


# =============================================================================
# User Profile Endpoints
# =============================================================================

@router.get("/user/me")
async def get_user_me(current_user: dict = Depends(get_current_user)):
    return _user_response(current_user)


@router.put("/user/profile")
async def update_profile(
    payload: ProfileUpdateRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    sanitized = SecurityMiddleware.sanitize_dict(payload.model_dump(exclude_unset=True))
    DatabaseService.update_user_profile(
        user_id=current_user["id"],
        first_name=sanitized.get("first_name"),
        last_name=sanitized.get("last_name"),
        profile_picture=sanitized.get("profile_picture"),
    )
    DatabaseService.log_audit(current_user["id"], "profile_update", "Profile updated.", _client_ip(request))
    return {"status": "success", "message": "Profile updated."}


@router.get("/user/resumes")
async def get_resumes(current_user: dict = Depends(get_current_user)):
    return DatabaseService.get_user_resumes(current_user["id"])


@router.get("/user/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    return DatabaseService.get_user_history(current_user["id"])


@router.delete("/user/history/{analysis_id}")
async def delete_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    deleted = DatabaseService.delete_analysis(current_user["id"], analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scan not found or not owned by you.")
    return {"status": "success", "analysis_id": analysis_id}


@router.delete("/user/account")
async def delete_account(request: Request, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    DatabaseService.delete_user_account(user_id)
    DatabaseService.log_audit(None, "account_deleted", f"User {user_id} deleted account.", _client_ip(request))
    return {"status": "success", "message": "Account permanently deleted."}


# =============================================================================
# Legacy Compatibility Routes
# =============================================================================

@router.get("/history")
async def get_history_legacy(current_user: dict = Depends(get_current_user)):
    return DatabaseService.get_user_history(current_user["id"])


@router.get("/history/analysis/{analysis_id}")
async def get_analysis_details(analysis_id: str, current_user: dict = Depends(get_current_user)):
    details = DatabaseService.get_analysis_details(current_user["id"], analysis_id)
    if not details:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return details


# =============================================================================
# ATS Analysis Endpoint
# =============================================================================

@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    experience_years: int = Form(5),
    target_role: str = Form("Software Engineer"),
    target_company: str = Form(""),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    filename = file.filename or "resume.pdf"
    file_ext = filename.split(".")[-1].lower()
    if file_ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload PDF, DOCX, or TXT.")

    try:
        content = await file.read()
        parsed_resume = ResumeParserService.parse_resume(content, file_ext)
        resume_text = parsed_resume["raw_text"]

        resume_skills = ScoringEngineService.extract_skills(resume_text)
        ats_results = ScoringEngineService.calculate_ats_score(parsed_resume, resume_skills)
        jd_results = ScoringEngineService.calculate_jd_match(resume_text, resume_skills, job_description, experience_years)
        grammar_results = ScoringEngineService.calculate_diagnostics(resume_text)

        # Bullet improvements
        bullet_improvements = []
        experience_text = parsed_resume["sections"].get("experience", "")

        def _is_job_title_line(s: str) -> bool:
            """Returns True for lines that look like job titles / date headers, not achievement bullets."""
            words = s.split()
            if not words:
                return True
            # Skip lines where >50% of words are all-uppercase (company/title lines)
            upper_count = sum(1 for w in words if w.isupper() and len(w) > 1)
            if upper_count / len(words) > 0.5:
                return True
            # Skip lines that are mostly a date or month reference (e.g. "October 2024")
            if re.match(r'^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s,]+\d{4}', s):
                return True
            return False

        raw_bullets = [b.strip() for b in re.split(r"[-•\n;]+", experience_text) if len(b.strip()) > 15]
        bullets = [b for b in raw_bullets if not _is_job_title_line(b)]
        for bullet in list(dict.fromkeys(bullets))[:4]:
            opt = LLMOptimizerService.optimize_bullet_point(bullet, target_role, target_company)
            if opt["weakness_score"] > 30:
                bullet_improvements.append(opt)

        if not bullet_improvements:
            bullet_improvements.append(
                LLMOptimizerService.optimize_bullet_point(
                    "Developed APIs for internal applications.", target_role, target_company
                )
            )

        must_fix = [i for i in ats_results["action_items"] if i["priority"] == "must_fix"]
        high_priority = [i for i in ats_results["action_items"] if i["priority"] == "high_priority"]
        medium_priority = [i for i in ats_results["action_items"] if i["priority"] == "medium_priority"]
        for item in jd_results["action_items"]:
            {"must_fix": must_fix, "high_priority": high_priority}.get(
                item["priority"], medium_priority
            ).append(item)

        overall_scores = {
            "ats_compatibility": ats_results["score"],
            "jd_match": jd_results["score"],
            "keyword_match": jd_results["breakdown"]["skills_match"],
            "formatting": ats_results["breakdown"]["formatting"],
            "grammar": grammar_results["score"],
            "experience": jd_results["breakdown"]["experience"],
            "projects": ats_results["breakdown"]["structure"],
        }

        result_payload = {
            "overall_scores": overall_scores,
            "keywords": jd_results["keywords"],
            "bullet_improvements": bullet_improvements,
            "grammar_errors": grammar_results["errors"],
            "formatting": parsed_resume["formatting"],
            "action_plan": {
                "must_fix": must_fix,
                "high_priority": high_priority,
                "medium_priority": medium_priority,
            },
        }

        if current_user:
            if current_user.get("ats_credits", 0) <= 0:
                raise HTTPException(status_code=403, detail="No ATS credits remaining. Please upgrade your plan.")

            resume_id = DatabaseService.create_resume(current_user["id"], filename, resume_text)
            jd_id = DatabaseService.create_job_description(
                current_user["id"], target_role, target_company, job_description, experience_years
            )
            analysis_id = DatabaseService.create_analysis(
                current_user["id"], resume_id, jd_id, overall_scores, result_payload
            )
            result_payload["analysis_id"] = analysis_id
            DatabaseService.deduct_credit(current_user["id"])

        return result_payload

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis engine error: {str(e)}")


@router.post("/rewriter/bullet")
async def rewrite_bullet(payload: BulletRewriteRequest):
    try:
        return LLMOptimizerService.optimize_bullet_point(
            payload.original_text, payload.target_role, payload.target_company
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
