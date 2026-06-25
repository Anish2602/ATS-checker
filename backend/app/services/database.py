import sqlite3
import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))
except ImportError:
    pass

DATABASE_URL = os.getenv("DATABASE_URL", "")
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ats_checker.db")


def _is_postgres() -> bool:
    return bool(DATABASE_URL)


def _get_pg_classes():
    """Returns a psycopg2-backed connection that mimics sqlite3's interface."""
    import psycopg2
    import psycopg2.extras

    class _PgCursor:
        def __init__(self, raw):
            self._c = raw

        def execute(self, sql: str, params=()):
            self._c.execute(sql.replace("?", "%s"), params or ())
            return self

        def executemany(self, sql: str, param_list):
            self._c.executemany(sql.replace("?", "%s"), param_list)

        def fetchone(self) -> Optional[dict]:
            row = self._c.fetchone()
            return dict(row) if row else None

        def fetchall(self) -> List[dict]:
            return [dict(r) for r in self._c.fetchall()]

        @property
        def rowcount(self):
            return self._c.rowcount

    class _PgConn:
        def __init__(self, url: str):
            self._raw = psycopg2.connect(url)

        def cursor(self) -> _PgCursor:
            return _PgCursor(self._raw.cursor(cursor_factory=psycopg2.extras.RealDictCursor))

        def commit(self):
            self._raw.commit()

        def close(self):
            self._raw.close()

        def rollback(self):
            self._raw.rollback()

    return _PgConn(DATABASE_URL)


def _get_sqlite_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


class DatabaseService:

    @classmethod
    def get_db_connection(cls):
        if _is_postgres():
            return _get_pg_classes()
        return _get_sqlite_conn()

    @classmethod
    def _fetchone(cls, row) -> Optional[dict]:
        if row is None:
            return None
        if isinstance(row, dict):
            return row
        return dict(row)

    # -------------------------------------------------------------------------
    # Schema Initialization
    # -------------------------------------------------------------------------

    @classmethod
    def initialize_db(cls):
        conn = cls.get_db_connection()
        cursor = conn.cursor()

        if _is_postgres():
            cls._init_postgres(cursor)
        else:
            cls._init_sqlite(cursor)

        conn.commit()
        conn.close()

    @classmethod
    def _init_postgres(cls, cursor):
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                full_name TEXT,
                first_name TEXT,
                last_name TEXT,
                profile_picture TEXT,
                auth_provider TEXT NOT NULL DEFAULT 'email',
                provider_user_id TEXT,
                email_verified INTEGER DEFAULT 0,
                subscription_plan TEXT DEFAULT 'Free',
                ats_credits INTEGER DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS verification_tokens (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TIMESTAMP NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_revoked INTEGER DEFAULT 0
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS oauth_accounts (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                provider TEXT NOT NULL,
                provider_user_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(provider, provider_user_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS login_history (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                ip_address TEXT,
                user_agent TEXT,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS resumes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                file_name TEXT NOT NULL,
                raw_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS job_descriptions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                company TEXT,
                raw_text TEXT NOT NULL,
                experience_years INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS resume_analyses (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
                job_description_id TEXT REFERENCES job_descriptions(id) ON DELETE SET NULL,
                ats_compatibility_score REAL NOT NULL,
                jd_match_score REAL NOT NULL,
                keyword_match_score REAL NOT NULL,
                formatting_score REAL NOT NULL,
                grammar_score REAL NOT NULL,
                experience_score REAL NOT NULL,
                project_score REAL NOT NULL,
                results_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    @classmethod
    def _init_sqlite(cls, cursor):
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]

        if columns and "auth_provider" not in columns:
            for tbl in ["resume_analyses", "job_descriptions", "resumes", "sessions", "users"]:
                cursor.execute(f"DROP TABLE IF EXISTS {tbl}")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                full_name TEXT,
                first_name TEXT,
                last_name TEXT,
                profile_picture TEXT,
                auth_provider TEXT NOT NULL DEFAULT 'email',
                provider_user_id TEXT,
                email_verified INTEGER DEFAULT 0,
                subscription_plan TEXT DEFAULT 'Free',
                ats_credits INTEGER DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS verification_tokens (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_revoked INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS oauth_accounts (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                provider TEXT NOT NULL,
                provider_user_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(provider, provider_user_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS login_history (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                status TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
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

    # -------------------------------------------------------------------------
    # User Operations
    # -------------------------------------------------------------------------

    @classmethod
    def create_user(
        cls,
        email: str,
        password_hash: Optional[str] = None,
        full_name: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        profile_picture: Optional[str] = None,
        auth_provider: str = "email",
        provider_user_id: Optional[str] = None,
        email_verified: int = 0,
        username: Optional[str] = None,
    ) -> str:
        user_id = str(uuid.uuid4())
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            if not username:
                username = f"{email.split('@')[0]}_{str(uuid.uuid4())[:6]}"
            if not full_name and (first_name or last_name):
                full_name = f"{first_name or ''} {last_name or ''}".strip()
            cursor.execute(
                """
                INSERT INTO users (
                    id, username, email, password_hash, full_name, first_name, last_name,
                    profile_picture, auth_provider, provider_user_id, email_verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    username.lower().strip(),
                    email.lower().strip(),
                    password_hash,
                    full_name,
                    first_name,
                    last_name,
                    profile_picture,
                    auth_provider,
                    provider_user_id,
                    email_verified,
                ),
            )
            conn.commit()
            return user_id
        finally:
            conn.close()

    @classmethod
    def get_user_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
            return cls._fetchone(cursor.fetchone())
        finally:
            conn.close()

    @classmethod
    def get_user_by_username(cls, username: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ?", (username.lower().strip(),))
            return cls._fetchone(cursor.fetchone())
        finally:
            conn.close()

    @classmethod
    def get_user_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            return cls._fetchone(cursor.fetchone())
        finally:
            conn.close()

    @classmethod
    def get_user_by_provider(cls, provider: str, provider_user_id: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT u.* FROM users u
                JOIN oauth_accounts o ON u.id = o.user_id
                WHERE o.provider = ? AND o.provider_user_id = ?
                """,
                (provider, provider_user_id),
            )
            return cls._fetchone(cursor.fetchone())
        finally:
            conn.close()

    @classmethod
    def update_user_profile(
        cls,
        user_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        profile_picture: Optional[str] = None,
    ):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            full_name = None
            if first_name is not None or last_name is not None:
                user = cls.get_user_by_id(user_id)
                fn = first_name if first_name is not None else (user or {}).get("first_name", "")
                ln = last_name if last_name is not None else (user or {}).get("last_name", "")
                full_name = f"{fn} {ln}".strip()
            cursor.execute(
                """
                UPDATE users
                SET first_name = COALESCE(?, first_name),
                    last_name  = COALESCE(?, last_name),
                    full_name  = COALESCE(?, full_name),
                    profile_picture = COALESCE(?, profile_picture),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (first_name, last_name, full_name, profile_picture, user_id),
            )
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def update_last_login(cls, user_id: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", (user_id,)
            )
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def verify_user_email(cls, user_id: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET email_verified = 1 WHERE id = ?", (user_id,))
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def delete_user_account(cls, user_id: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def deduct_credit(cls, user_id: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET ats_credits = MAX(0, ats_credits - 1) WHERE id = ?",
                (user_id,),
            )
            conn.commit()
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # Verification Tokens
    # -------------------------------------------------------------------------

    @classmethod
    def create_verification_token(cls, user_id: str) -> str:
        # Invalidate any existing tokens for this user
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM verification_tokens WHERE user_id = ?", (user_id,))
            token = str(uuid.uuid4())
            expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()
            cursor.execute(
                "INSERT INTO verification_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
                (token, user_id, expires_at),
            )
            conn.commit()
            return token
        finally:
            conn.close()

    @classmethod
    def get_verification_token(cls, token: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM verification_tokens WHERE token = ?", (token,))
            return cls._fetchone(cursor.fetchone())
        finally:
            conn.close()

    @classmethod
    def delete_verification_token(cls, token: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM verification_tokens WHERE token = ?", (token,))
            conn.commit()
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # Password Reset Tokens
    # -------------------------------------------------------------------------

    @classmethod
    def create_password_reset_token(cls, user_id: str) -> str:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM password_reset_tokens WHERE user_id = ?", (user_id,))
            token = str(uuid.uuid4())
            expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
            cursor.execute(
                "INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
                (token, user_id, expires_at),
            )
            conn.commit()
            return token
        finally:
            conn.close()

    @classmethod
    def get_password_reset_token(cls, token: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM password_reset_tokens WHERE token = ?", (token,))
            return cls._fetchone(cursor.fetchone())
        finally:
            conn.close()

    @classmethod
    def delete_password_reset_token(cls, token: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM password_reset_tokens WHERE token = ?", (token,))
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def update_password(cls, user_id: str, password_hash: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (password_hash, user_id),
            )
            conn.commit()
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # Session / Refresh Tokens
    # -------------------------------------------------------------------------

    @classmethod
    def create_user_session(
        cls,
        user_id: str,
        token: str,
        expires_at: datetime,
        ip: Optional[str],
        ua: Optional[str],
    ):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO user_sessions (token, user_id, expires_at, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?)
                """,
                (token, user_id, expires_at.isoformat(), ip, ua),
            )
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def get_user_session(cls, token: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM user_sessions WHERE token = ? AND is_revoked = 0", (token,)
            )
            return cls._fetchone(cursor.fetchone())
        finally:
            conn.close()

    @classmethod
    def revoke_user_session(cls, token: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE user_sessions SET is_revoked = 1 WHERE token = ?", (token,))
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def revoke_all_user_sessions(cls, user_id: str):
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE user_sessions SET is_revoked = 1 WHERE user_id = ?", (user_id,)
            )
            conn.commit()
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # OAuth Accounts
    # -------------------------------------------------------------------------

    @classmethod
    def create_oauth_account(cls, user_id: str, provider: str, provider_user_id: str):
        acc_id = str(uuid.uuid4())
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            if _is_postgres():
                cursor.execute(
                    """
                    INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id)
                    VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING
                    """,
                    (acc_id, user_id, provider, provider_user_id),
                )
            else:
                cursor.execute(
                    """
                    INSERT OR IGNORE INTO oauth_accounts (id, user_id, provider, provider_user_id)
                    VALUES (?, ?, ?, ?)
                    """,
                    (acc_id, user_id, provider, provider_user_id),
                )
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def get_oauth_account(cls, provider: str, provider_user_id: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?",
                (provider, provider_user_id),
            )
            return cls._fetchone(cursor.fetchone())
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # Audit & Logs
    # -------------------------------------------------------------------------

    @classmethod
    def log_login(cls, user_id: str, ip: Optional[str], ua: Optional[str], status: str):
        log_id = str(uuid.uuid4())
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO login_history (id, user_id, ip_address, user_agent, status) VALUES (?, ?, ?, ?, ?)",
                (log_id, user_id, ip, ua, status),
            )
            conn.commit()
        finally:
            conn.close()

    @classmethod
    def log_audit(cls, user_id: Optional[str], action: str, details: str, ip: Optional[str]):
        log_id = str(uuid.uuid4())
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO audit_logs (id, user_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)",
                (log_id, user_id, action, details, ip),
            )
            conn.commit()
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # Resume & JD Operations (Row-Level Security via user_id)
    # -------------------------------------------------------------------------

    @classmethod
    def create_resume(cls, user_id: str, file_name: str, raw_text: str) -> str:
        resume_id = str(uuid.uuid4())
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO resumes (id, user_id, file_name, raw_text) VALUES (?, ?, ?, ?)",
                (resume_id, user_id, file_name, raw_text),
            )
            conn.commit()
            return resume_id
        finally:
            conn.close()

    @classmethod
    def get_user_resumes(cls, user_id: str) -> List[Dict[str, Any]]:
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, file_name, created_at FROM resumes WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,),
            )
            return [cls._fetchone(r) for r in cursor.fetchall()]
        finally:
            conn.close()

    @classmethod
    def create_job_description(
        cls, user_id: str, title: str, company: str, raw_text: str, experience_years: int
    ) -> str:
        jd_id = str(uuid.uuid4())
        conn = cls.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO job_descriptions (id, user_id, title, company, raw_text, experience_years) VALUES (?, ?, ?, ?, ?, ?)",
                (jd_id, user_id, title, company, raw_text, experience_years),
            )
            conn.commit()
            return jd_id
        finally:
            conn.close()

    @classmethod
    def create_analysis(
        cls,
        user_id: str,
        resume_id: str,
        jd_id: Optional[str],
        overall_scores: Dict[str, Any],
        results: Dict[str, Any],
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
                    json.dumps(results),
                ),
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
                (user_id,),
            )
            rows = cursor.fetchall()
            return [cls._fetchone(r) for r in rows]
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
                    a.user_id,
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
                (analysis_id, user_id),
            )
            row = cursor.fetchone()
            if row:
                data = cls._fetchone(row)
                data["results"] = json.loads(data["results_json"])
                del data["results_json"]
                return data
            return None
        finally:
            conn.close()
