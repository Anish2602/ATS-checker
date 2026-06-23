import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router
from app.services.database import DatabaseService

app = FastAPI(
    title="Enterprise ATS Resume Analyzer Engine",
    description="Microservice API for parsing, scoring, and optimizing resumes against JDs.",
    version="1.0.0"
)

# Initialize database on application startup
@app.on_event("startup")
def on_startup():
    DatabaseService.initialize_db()

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(router)

@app.get("/health")
def health_check():
    """Simple status check route."""
    return {"status": "healthy", "service": "ats-analyzer-engine"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

