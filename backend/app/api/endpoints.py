import re
import secrets
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.parser import ResumeParserService
from app.services.scoring import ScoringEngineService
from app.services.llm_optimizer import LLMOptimizerService
from app.services.database import DatabaseService
from app.services.auth import AuthService, get_current_user, get_optional_user

router = APIRouter(prefix="/api/v1")

class BulletRewriteRequest(BaseModel):
    original_text: str
    target_role: str
    target_company: Optional[str] = ""

class UserSignupRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    age: int
    phone_number: str

class UserLoginRequest(BaseModel):
    username: str  # Can be username or email
    password: str

class UserVerifyRequest(BaseModel):
    user_id: str

class SocialLoginRequest(BaseModel):
    provider: str  # 'google', 'apple', 'microsoft'
    email: str
    full_name: str

# --- Authentication Endpoints ---

@router.post("/auth/signup")
async def signup(payload: UserSignupRequest):
    email = payload.email.strip()
    username = payload.username.strip()
    full_name = payload.full_name.strip()
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if not full_name:
        raise HTTPException(status_code=400, detail="Full Name is required.")
    if payload.age <= 0:
        raise HTTPException(status_code=400, detail="Age must be a positive integer.")
    
    # Check uniqueness
    if DatabaseService.get_user_by_email(email):
        raise HTTPException(status_code=400, detail="Email is already registered.")
    if DatabaseService.get_user_by_username(username):
        raise HTTPException(status_code=400, detail="Username is already taken.")
    
    password_hash = AuthService.hash_password(payload.password)
    try:
        user_id = DatabaseService.create_user(
            username=username,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            age=payload.age,
            phone_number=payload.phone_number,
            is_verified=0  # Account starts unverified, requires Google Auth
        )
        return {"status": "success", "user_id": user_id, "email": email}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@router.post("/auth/login")
async def login(payload: UserLoginRequest):
    username_or_email = payload.username.strip()
    user = DatabaseService.get_user_by_username_or_email(username_or_email)
    
    if not user or not AuthService.verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email/username or password.")
    
    # Check if user is verified
    if not user["is_verified"]:
        # Raise special validation check to trigger frontend verification prompt
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "EMAIL_UNVERIFIED",
                "user_id": user["id"],
                "email": user["email"],
                "message": "Please verify your email using Google Auth to sign in."
            }
        )
    
    token = DatabaseService.create_session(user["id"])
    return {"token": token, "email": user["email"]}

@router.post("/auth/verify")
async def verify_user(payload: UserVerifyRequest):
    user = DatabaseService.get_user_by_id(payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    try:
        DatabaseService.verify_user_email(payload.user_id)
        return {"status": "success", "message": "Email verified successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@router.post("/auth/social-login")
async def social_login(payload: SocialLoginRequest):
    email = payload.email.lower().strip()
    provider = payload.provider.strip()
    full_name = payload.full_name.strip()
    
    user = DatabaseService.get_user_by_email(email)
    
    if not user:
        # Create a new, auto-verified user for social authentication
        # Generate a random username from email prefix
        email_prefix = email.split("@")[0]
        random_suffix = secrets.token_hex(3)
        username = f"{email_prefix}_{random_suffix}"
        
        # Placeholders for age/phone as they are logging in via OAuth
        random_pass = secrets.token_hex(16)
        password_hash = AuthService.hash_password(random_pass)
        
        try:
            user_id = DatabaseService.create_user(
                username=username,
                email=email,
                password_hash=password_hash,
                full_name=full_name,
                age=25,  # default placeholder
                phone_number="",
                is_verified=1  # Social accounts are pre-verified
            )
            user = DatabaseService.get_user_by_id(user_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OAuth profile creation failed: {str(e)}")
            
    # If user exists but wasn't verified, verify them since they successfully authenticated via OAuth
    if user and not user["is_verified"]:
        DatabaseService.verify_user_email(user["id"])
        
    token = DatabaseService.create_session(user["id"])
    return {"token": token, "email": user["email"]}

@router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "email": current_user["email"], 
        "id": current_user["id"], 
        "username": current_user["username"],
        "full_name": current_user["full_name"]
    }

# --- History Endpoints ---

@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    try:
        return DatabaseService.get_user_history(current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.get("/history/analysis/{analysis_id}")
async def get_analysis_details(analysis_id: str, current_user: dict = Depends(get_current_user)):
    details = DatabaseService.get_analysis_details(current_user["id"], analysis_id)
    if not details:
        raise HTTPException(status_code=404, detail="Analysis history record not found.")
    return details

# --- Scan and Optimize Endpoints ---

@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    experience_years: int = Form(5),
    target_role: str = Form("Software Engineer"),
    target_company: str = Form(""),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """Processes uploaded resume and job description, calculating scoring analytics."""
    # Check extension
    filename = file.filename or "resume.pdf"
    file_ext = filename.split(".")[-1].lower()
    if file_ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(status_code=400, detail="Invalid file format. Upload PDF, DOCX, or TXT.")

    try:
        # Read content
        content = await file.read()
        
        # Parse resume structure and text
        parsed_resume = ResumeParserService.parse_resume(content, file_ext)
        resume_text = parsed_resume["raw_text"]
        
        # Extract skills
        resume_skills = ScoringEngineService.extract_skills(resume_text)
        
        # Calculate Scores
        ats_results = ScoringEngineService.calculate_ats_score(parsed_resume, resume_skills)
        jd_results = ScoringEngineService.calculate_jd_match(resume_text, resume_skills, job_description, experience_years)
        grammar_results = ScoringEngineService.calculate_diagnostics(resume_text)
        
        # Extract weak bullet points from experience and trigger auto-improvements
        bullet_improvements = []
        experience_text = parsed_resume["sections"].get("experience", "")
        
        # Split experience by bullet points or sentences
        bullets = re.split(r'[-•\n\.\;]+', experience_text)
        bullets = [b.strip() for b in bullets if len(b.strip()) > 15]
        
        # Deduplicate and limit to 4 candidates to prevent performance lag
        unique_bullets = list(dict.fromkeys(bullets))[:4]
        
        for bullet in unique_bullets:
            opt = LLMOptimizerService.optimize_bullet_point(bullet, target_role, target_company)
            # Only include if it represents a weak description (e.g. score > 30)
            if opt["weakness_score"] > 30:
                bullet_improvements.append(opt)
                
        # If no bullet improvements were generated, add a sample one to showcase
        if not bullet_improvements:
            bullet_improvements.append(
                LLMOptimizerService.optimize_bullet_point(
                    "Developed APIs for internal applications.", 
                    target_role, 
                    target_company
                )
            )

        # Merge action plans
        must_fix = [item for item in ats_results["action_items"] if item["priority"] == "must_fix"]
        high_priority = [item for item in ats_results["action_items"] if item["priority"] == "high_priority"]
        medium_priority = [item for item in ats_results["action_items"] if item["priority"] == "medium_priority"]
        
        # Add keyword action items
        for item in jd_results["action_items"]:
            if item["priority"] == "must_fix":
                must_fix.append(item)
            elif item["priority"] == "high_priority":
                high_priority.append(item)
            else:
                medium_priority.append(item)
                
        # Return composite dashboard payload
        overall_scores = {
            "ats_compatibility": ats_results["score"],
            "jd_match": jd_results["score"],
            "keyword_match": jd_results["breakdown"]["skills_match"],
            "formatting": ats_results["breakdown"]["formatting"],
            "grammar": grammar_results["score"],
            "experience": jd_results["breakdown"]["experience"],
            "projects": ats_results["breakdown"]["structure"]
        }

        payload = {
            "overall_scores": overall_scores,
            "keywords": jd_results["keywords"],
            "bullet_improvements": bullet_improvements,
            "grammar_errors": grammar_results["errors"],
            "formatting": parsed_resume["formatting"],
            "action_plan": {
                "must_fix": must_fix,
                "high_priority": high_priority,
                "medium_priority": medium_priority
            }
        }

        # If user is authenticated, persist all data to the database
        if current_user:
            resume_id = DatabaseService.create_resume(current_user["id"], filename, resume_text)
            jd_id = DatabaseService.create_job_description(
                current_user["id"], 
                target_role, 
                target_company, 
                job_description, 
                experience_years
            )
            analysis_id = DatabaseService.create_analysis(
                current_user["id"],
                resume_id,
                jd_id,
                overall_scores,
                payload
            )
            payload["analysis_id"] = analysis_id

        return payload
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal engine failure: {str(e)}")

@router.post("/rewriter/bullet")
async def rewrite_bullet(payload: BulletRewriteRequest):
    """Exposes direct isolated endpoint to rewrite a single bullet point."""
    try:
        opt = LLMOptimizerService.optimize_bullet_point(
            payload.original_text, 
            payload.target_role, 
            payload.target_company
        )
        return opt
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
