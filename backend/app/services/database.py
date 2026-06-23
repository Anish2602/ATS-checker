import sqlite3
import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ats_checker.db")

class DatabaseService:
    @classmethod
    def get_db_connection(cls):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def initialize_db(cls):
        """Creates tables if they do not exist, and handles schema updates if necessary."""
        conn = cls.get_db_connection()
        cursor = conn.cursor()

        # Check if users table exists and if it has 'username' column
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if columns and "username" not in columns:
            # Table exists but lacks the username field: perform a clean drop to migrate schemas in dev
            cursor.execute("DROP TABLE IF EXISTS resume_analyses")
            cursor.execute("DROP TABLE IF EXISTS job_descriptions")
            cursor.execute("DROP TABLE IF EXISTS resumes")
            cursor.execute("DROP TABLE IF EXISTS sessions")
            cursor.execute("DROP TABLE IF EXISTS users")
            conn.commit()

        # Users table (with Name, Age, Phone Number, Username, and Verified state)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                age INTEGER,
                phone_number TEXT,
                is_verified INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)

        # Resumes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS resumes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                raw_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)

        # Job descriptions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS job_descriptions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                company TEXT,
                raw_text TEXT NOT NULL,
                experience_years INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)

        # Resume Analyses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS resume_analyses (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                resume_id TEXT NOT NULL,
                job_description_id TEXT,
                ats_compatibility_score REAL NOT NULL,
                jd_match_score REAL NOT NULL,
                keyword_match_score REAL NOT NULL,
                formatting_score REAL NOT NULL,
                grammar_score REAL NOT NULL,
                experience_score REAL NOT NULL,
                project_score REAL NOT NULL,
                results_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (resume_id) REFERENCES resumes (id) ON DELETE CASCADE,
                FOREIGN KEY (job_description_id) REFERENCES job_descriptions (id) ON DELETE SET NULL
            )
        """)

        conn.commit()
        conn.close()

    # --- User operations ---
    @classmethod
    def create_user(
        cls, 
        username: str, 
        email: str, 
        password_hash: str, 
        full_name: str, 
        age: int, 
        phone_number: str,
        is_verified: int = 0
    ) -> str:
        user_id = str(uuid.uuid4())
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO users (id, username, email, password_hash, full_name, age, phone_number, is_verified) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id, 
                    username.lower().strip(), 
                    email.lower().strip(), 
                    password_hash, 
                    full_name.strip(), 
                    age, 
                    phone_number.strip(),
                    is_verified
                )
            )
            conn.commit()
            return user_id
        finally:
            conn.close()

    @classmethod
    def verify_user_email(cls, user_id: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET is_verified = 1 WHERE id = ?", (user_id,))
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def get_user_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
        finally:
            conn.close()

    @classmethod
    def get_user_by_username(cls, username: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ?", (username.lower().strip(),))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
        finally:
            conn.close()

    @classmethod
    def get_user_by_username_or_email(cls, login_id: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM users WHERE username = ? OR email = ?", 
                (login_id.lower().strip(), login_id.lower().strip())
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
        finally:
            conn.close()

    @classmethod
    def get_user_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
        finally:
            conn.close()

    # --- Session operations ---
    @classmethod
    def create_session(cls, user_id: str) -> str:
        token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(days=7)
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
                (token, user_id, expires_at.isoformat())
            )
            conn.commit()
            return token
        finally:
            conn.close()

    @classmethod
    def get_session(cls, token: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sessions WHERE token = ?", (token,))
            row = cursor.fetchone()
            if row:
                session = dict(row)
                # Check expiration
                expires_at = datetime.fromisoformat(session["expires_at"])
                if expires_at > datetime.utcnow():
                    return session
                else:
                    # Session expired, delete it
                    cls.delete_session(token)
            return None
        finally:
            conn.close()

    @classmethod
    def delete_session(cls, token: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
        finally:
            conn.close()

    # --- Resume & JD operations ---
    @classmethod
    def create_resume(cls, user_id: str, file_name: str, raw_text: str) -> str:
        resume_id = str(uuid.uuid4())
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO resumes (id, user_id, file_name, raw_text) VALUES (?, ?, ?, ?)",
                (resume_id, user_id, file_name, raw_text)
            )
            conn.commit()
            return resume_id
        finally:
            conn.close()

    @classmethod
    def create_job_description(cls, user_id: str, title: str, company: str, raw_text: str, experience_years: int) -> str:
        jd_id = str(uuid.uuid4())
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO job_descriptions (id, user_id, title, company, raw_text, experience_years) VALUES (?, ?, ?, ?, ?, ?)",
                (jd_id, user_id, title, company, raw_text, experience_years)
            )
            conn.commit()
            return jd_id
        finally:
            conn.close()

    # --- Analysis operations ---
    @classmethod
    def create_analysis(
        cls, 
        user_id: str, 
        resume_id: str, 
        jd_id: Optional[str], 
        overall_scores: Dict[str, Any], 
        results: Dict[str, Any]
    ) -> str:
        analysis_id = str(uuid.uuid4())
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO resume_analyses (
                    id, user_id, resume_id, job_description_id,
                    ats_compatibility_score, jd_match_score, keyword_match_score,
                    formatting_score, grammar_score, experience_score, project_score,
                    results_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    analysis_id, user_id, resume_id, jd_id,
                    overall_scores.get("ats_compatibility", 0.0),
                    overall_scores.get("jd_match", 0.0),
                    overall_scores.get("keyword_match", 0.0),
                    overall_scores.get("formatting", 0.0),
                    overall_scores.get("grammar", 0.0),
                    overall_scores.get("experience", 0.0),
                    overall_scores.get("projects", 0.0),
                    json.dumps(results)
                )
            )
            conn.commit()
            return analysis_id
        finally:
            conn.close()

    @classmethod
    def get_user_history(cls, user_id: str) -> List[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT 
                    a.id as analysis_id,
                    a.created_at,
                    a.ats_compatibility_score as ats_score,
                    a.jd_match_score as jd_score,
                    r.file_name as resume_name,
                    j.title as jd_title,
                    j.company as company_name
                FROM resume_analyses a
                JOIN resumes r ON a.resume_id = r.id
                LEFT JOIN job_descriptions j ON a.job_description_id = j.id
                WHERE a.user_id = ?
                ORDER BY a.created_at DESC
                """,
                (user_id,)
            )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()

    @classmethod
    def get_analysis_details(cls, user_id: str, analysis_id: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT 
                    a.id as analysis_id,
                    a.results_json,
                    r.file_name as resume_name,
                    r.raw_text as resume_text,
                    j.title as jd_title,
                    j.company as company_name,
                    j.raw_text as jd_text,
                    j.experience_years as jd_experience
                FROM resume_analyses a
                JOIN resumes r ON a.resume_id = r.id
                LEFT JOIN job_descriptions j ON a.job_description_id = j.id
                WHERE a.id = ? AND a.user_id = ?
                """,
                (analysis_id, user_id)
            )
            row = cursor.fetchone()
            if row:
                data = dict(row)
                data["results"] = json.loads(data["results_json"])
                del data["results_json"]
                return data
            return None
        finally:
            conn.close()
