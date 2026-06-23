-- PostgreSQL Database Schema Specification for Enterprise-Grade ATS Analyzer
-- Compatibility: PostgreSQL 14+, pgvector 0.4.0+

-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS & TRIGGERS CONFIGURATION
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Automated Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. USER DIRECTORY & WORKSPACES
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(50) DEFAULT 'user', -- user, admin, enterprise_admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_tier VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
    status VARCHAR(50) NOT NULL, -- active, trialing, past_due, canceled
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_subscriptions_timestamp
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. DOCUMENTS: RESUMES & JOB DESCRIPTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    s3_url VARCHAR(512) NOT NULL,
    file_type VARCHAR(10) NOT NULL, -- pdf, docx, txt
    raw_text TEXT NOT NULL,
    cleaned_text TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- e.g., page count, character sets, font structures, columns detected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_resumes_timestamp
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    raw_text TEXT NOT NULL,
    parsed_skills TEXT[] DEFAULT '{}',
    parsed_experience_years INT DEFAULT 0,
    parsed_education_minimum VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_jds_timestamp
    BEFORE UPDATE ON job_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. ANALYTICS, SCORES & RECOMMENDATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE resume_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_description_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
    
    -- Main Scores
    ats_compatibility_score NUMERIC(5, 2) NOT NULL,
    jd_match_score NUMERIC(5, 2) NOT NULL,
    
    -- Scores Breakdown
    keyword_score NUMERIC(5, 2) NOT NULL,
    formatting_score NUMERIC(5, 2) NOT NULL,
    grammar_score NUMERIC(5, 2) NOT NULL,
    experience_score NUMERIC(5, 2) NOT NULL,
    project_score NUMERIC(5, 2) NOT NULL,
    structure_score NUMERIC(5, 2) NOT NULL,
    
    -- JSON Structuring
    action_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Must Fix, High, Medium, Low Priorities
    grammar_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    formatting_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analysis_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES resume_analyses(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- hard_skill, tech_stack, tool, soft_skill, certification
    presence_status VARCHAR(20) NOT NULL, -- present, missing, overused
    frequency_in_resume INT DEFAULT 0,
    frequency_in_jd INT DEFAULT 0
);

CREATE TABLE bullet_improvements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES resume_analyses(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    improved_text TEXT NOT NULL,
    weakness_score INT CHECK (weakness_score BETWEEN 0 AND 100),
    reasons VARCHAR[] NOT NULL,
    section VARCHAR(50) DEFAULT 'experience' -- experience, projects, summary
);

-- -----------------------------------------------------------------------------
-- 5. BENCHMARKS & VECTOR REPRESENTATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE candidate_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_category VARCHAR(100) NOT NULL,
    seniority_level VARCHAR(50) NOT NULL,
    segment VARCHAR(50) NOT NULL, -- faang, startup, general
    skill_vector VECTOR(1536) NOT NULL, -- Embedding representation using text-embedding-3-small
    experience_vector VECTOR(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. SYSTEM LOGGING & LIMIT MONITORING
-- -----------------------------------------------------------------------------
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    token_usage_input INT DEFAULT 0,
    token_usage_output INT DEFAULT 0,
    execution_duration_ms INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
-- Primary lookup performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_jds_user_id ON job_descriptions(user_id);
CREATE INDEX idx_analyses_resume_jd ON resume_analyses(resume_id, job_description_id);

-- GIN Indexing for JSONB fields
CREATE INDEX idx_resumes_metadata_gin ON resumes USING gin (metadata);
CREATE INDEX idx_analyses_action_items_gin ON resume_analyses USING gin (action_items);

-- Text matching optimization index
CREATE INDEX idx_keywords_analysis_lookup ON analysis_keywords(analysis_id, keyword, presence_status);

-- pgvector Indexing (HNSW)
-- Using Cosine Distance Operator (vector_cosine_ops)
CREATE INDEX idx_benchmarks_skills_hnsw ON candidate_benchmarks USING hnsw (skill_vector vector_cosine_ops);
CREATE INDEX idx_benchmarks_exp_hnsw ON candidate_benchmarks USING hnsw (experience_vector vector_cosine_ops);

-- -----------------------------------------------------------------------------
-- 8. SECURITY & ROW LEVEL ISOLATION (RLS)
-- -----------------------------------------------------------------------------
-- Activate RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Users can only read/write their own user record
CREATE POLICY user_self_policy ON users
    FOR ALL USING (id = current_setting('app.current_user_id', true)::uuid);

-- Subscriptions are readable by corresponding user
CREATE POLICY subscription_self_policy ON subscriptions
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Resumes are limited to the uploading user
CREATE POLICY resume_self_policy ON resumes
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Job descriptions are limited to the creating user
CREATE POLICY jd_self_policy ON job_descriptions
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Analyses policy checks owner of parent resume
CREATE POLICY analysis_self_policy ON resume_analyses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM resumes 
            WHERE resumes.id = resume_analyses.resume_id 
              AND resumes.user_id = current_setting('app.current_user_id', true)::uuid
        )
    );

-- Usage logs restricted to the log creator
CREATE POLICY usage_logs_self_policy ON usage_logs
    FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid);
