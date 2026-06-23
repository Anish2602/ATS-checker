import re
import math
from typing import Dict, Any, List, Set

class ScoringEngineService:
    # A standard library of common technical and soft skills for parsing matching
    COMMON_SKILLS = {
        "python", "go", "golang", "java", "c++", "c#", "javascript", "typescript", "ruby", "rust", "php",
        "react", "angular", "vue", "next.js", "node.js", "express", "django", "fastapi", "flask", "spring",
        "kubernetes", "docker", "aws", "gcp", "azure", "ci/cd", "jenkins", "git", "github", "gitlab",
        "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq", "graphql",
        "rest api", "apis", "microservices", "system design", "distributed systems", "scrum", "agile",
        "machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "html", "css", "tailwind",
        "terraform", "ansible", "prometheus", "grafana", "linux", "bash", "testing", "unit tests"
    }

    @classmethod
    def extract_skills(cls, text: str) -> Set[str]:
        """Extracts known tech skills from raw text using word boundary scanning."""
        found = set()
        clean_text = text.lower()
        # Replace special characters with spaces to match clean tokens
        normalized = re.sub(r'[^\w\s\.\-\#\+]', ' ', clean_text)
        
        for skill in cls.COMMON_SKILLS:
            # Escape skill for regex matching (handling c++, c#, next.js, etc.)
            escaped = re.escape(skill)
            # Match boundary for general words, custom boundaries for special characters
            pattern = r'(?:\b|(?<=[\s]))' + escaped + r'(?:\b|(?=[\s]))'
            if re.search(pattern, normalized):
                found.add(skill)
        return found

    @classmethod
    def calculate_readability(cls, text: str) -> float:
        """Calculates Flesch-Kincaid Grade Level and returns a score out of 100."""
        # Clean text first
        words = re.findall(r'\b\w+\b', text)
        sentences = re.split(r'[.!?]+', text)
        sentences = [s for s in sentences if len(s.strip()) > 3]
        
        if not words or not sentences:
            return 80.0 # Default fallback
            
        word_count = len(words)
        sentence_count = len(sentences)
        
        # Simple syllable count approximation: count vowels (excluding silent vowels)
        syllables = 0
        for w in words:
            w_lower = w.lower()
            vowels = "aeiouy"
            count = 0
            if w_lower[0] in vowels:
                count += 1
            for index in range(1, len(w_lower)):
                if w_lower[index] in vowels and w_lower[index - 1] not in vowels:
                    count += 1
            if w_lower.endswith("e"):
                count -= 1
            if count == 0:
                count = 1
            syllables += count
            
        # Flesch-Kincaid Grade Level
        fk_grade = 0.39 * (word_count / sentence_count) + 11.8 * (syllables / word_count) - 15.59
        
        # Normalize to target (Grade 12 is optimal, score is 100)
        # Using a Gaussian curve centered at grade 12
        try:
            score = 100 * math.exp(-((fk_grade - 12) ** 2) / (2 * (3.5 ** 2)))
        except Exception:
            score = 80.0
            
        return round(max(0.0, min(100.0, score)), 2)

    @classmethod
    def calculate_ats_score(cls, parsed_resume: Dict[str, Any], resume_skills: Set[str]) -> Dict[str, Any]:
        """Calculates $S_{ATS}$ out of 100 based on formatting, structure, and readability."""
        formatting = parsed_resume.get("formatting", {})
        sections = parsed_resume.get("sections", {})
        
        # 1. Parseability (OCR status)
        s_parse = 0.0 if formatting.get("is_scanned", False) else 100.0
        
        # 2. Formatting Score (Deductions logic)
        s_format = 100.0
        if formatting.get("has_tables", False):
            s_format -= 15.0
        if formatting.get("has_columns", False):
            s_format -= 15.0
        if formatting.get("has_images", False):
            s_format -= 10.0
        if formatting.get("is_scanned", False):
            s_format -= 20.0
        s_format = max(0.0, s_format)
        
        # 3. Structure Score (Checks standard headers)
        present_sections = [k for k, v in sections.items() if len(v.strip()) > 20]
        s_structure = (len(present_sections) / len(sections)) * 100.0
        
        # 4. Readability Score
        s_readability = cls.calculate_readability(parsed_resume["raw_text"])
        
        # 5. Friendliness
        s_friendliness = 100.0
        if formatting.get("has_images", False) or formatting.get("is_scanned", False):
            s_friendliness -= 20.0
        s_friendliness = max(0.0, s_friendliness)
        
        # Overall ATS Compatibility Score
        w_parse = 0.20
        w_format = 0.20
        w_structure = 0.25
        w_readability = 0.15
        w_friendliness = 0.20
        
        overall_ats = (
            w_parse * s_parse +
            w_format * s_format +
            w_structure * s_structure +
            w_readability * s_readability +
            w_friendliness * s_friendliness
        )
        
        # Compile action items based on issues
        action_items = []
        if formatting.get("is_scanned", False):
            action_items.append({
                "priority": "must_fix",
                "category": "formatting",
                "message": "Resume appears to be scanned or contains non-selectable text. Ensure your document is saved as a digital PDF."
            })
        if formatting.get("has_columns", False):
            action_items.append({
                "priority": "high_priority",
                "category": "formatting",
                "message": "Multi-column layouts detected. ATS parsers read columns left-to-right, which can scramble your experience. Use a single-column layout."
            })
        if formatting.get("has_tables", False):
            action_items.append({
                "priority": "medium_priority",
                "category": "formatting",
                "message": "Tables detected. Nested grids can confuse parsers. Prefer tab-stops or simple margins to align text."
            })
        if s_structure < 80.0:
            missing = [k.capitalize() for k, v in sections.items() if len(v.strip()) <= 20]
            action_items.append({
                "priority": "must_fix",
                "category": "structure",
                "message": f"Missing or unidentifiable standard sections: {', '.join(missing)}. Add explicit headings."
            })
            
        return {
            "score": round(overall_ats, 2),
            "breakdown": {
                "parseability": s_parse,
                "formatting": s_format,
                "structure": s_structure,
                "readability": s_readability,
                "friendliness": s_friendliness
            },
            "action_items": action_items
        }

    @classmethod
    def calculate_jd_match(cls, resume_text: str, resume_skills: Set[str], jd_text: str, target_exp: int) -> Dict[str, Any]:
        """Calculates $S_{JD}$ score comparing resume details against target Job Description."""
        # Extract skills from JD
        jd_skills = cls.extract_skills(jd_text)
        
        if not jd_skills:
            # Default fallback if JD has no detectable skills
            jd_skills = {"python", "sql", "git", "system design"}
            
        # 1. Skills Match Score (Lexical Jaccard match)
        matched_skills = resume_skills.intersection(jd_skills)
        missing_skills = jd_skills.difference(resume_skills)
        
        s_skills = (len(matched_skills) / len(jd_skills)) * 100.0
        
        # 2. Tech Stack Match
        # Identify core hard skills (e.g. languages/frameworks)
        tech_words = {"python", "go", "golang", "java", "c++", "c#", "rust", "react", "kubernetes", "docker", "aws", "kafka"}
        jd_tech = jd_skills.intersection(tech_words)
        res_tech = resume_skills.intersection(tech_words)
        if jd_tech:
            s_tech = (len(res_tech.intersection(jd_tech)) / len(jd_tech)) * 100.0
        else:
            s_tech = s_skills
            
        # 3. Responsibilities Match (simulated semantic overlap or keyword overlap ratio)
        # Scan experience section for key action verbs present in the JD
        action_verbs = {"develop", "build", "optimize", "lead", "manage", "deploy", "design", "architect", "scale", "reduce"}
        jd_actions = [v for v in action_verbs if v in jd_text.lower()]
        res_actions = [v for v in action_verbs if v in resume_text.lower()]
        if jd_actions:
            s_resp = (len(set(res_actions).intersection(set(jd_actions))) / len(set(jd_actions))) * 100.0
        else:
            s_resp = 75.0
            
        # 4. Experience Match Score
        # Extract candidate experience years from resume (regex heuristic scanning years of dates)
        candidate_exp = cls.heuristically_calculate_experience(resume_text)
        if candidate_exp >= target_exp:
            s_exp = 100.0
        elif target_exp > 0:
            # Quadratic decay
            s_exp = ((candidate_exp / target_exp) ** 2) * 100.0
        else:
            s_exp = 100.0
            
        # 5. Education Match (checks for degree matches)
        has_degree = False
        degrees = ["ph.d", "phd", "master", "m.s", "bachelor", "b.s", "degree", "university", "college"]
        for deg in degrees:
            if deg in resume_text.lower():
                has_degree = True
                break
        s_edu = 100.0 if has_degree else 50.0
        
        # 6. Domain Match (Simulated sector overlap)
        s_domain = 85.0 if s_skills > 60 else 60.0
        
        # Weighted Overall JD Match
        w_skills = 0.25
        w_tech = 0.25
        w_resp = 0.20
        w_exp = 0.15
        w_edu = 0.05
        w_domain = 0.10
        
        overall_jd = (
            w_skills * s_skills +
            w_tech * s_tech +
            w_resp * s_resp +
            w_exp * s_exp +
            w_edu * s_edu +
            w_domain * s_domain
        )
        
        # Keyword stuffing checklist (density checks)
        keyword_density_actions = []
        words = re.findall(r'\b\w+\b', resume_text.lower())
        total_words = len(words)
        
        overused = []
        for skill in matched_skills:
            # Calculate occurrences
            count = len(re.findall(r'(?:\b|(?<=[\s]))' + re.escape(skill) + r'(?:\b|(?=[\s]))', resume_text.lower()))
            density = count / total_words if total_words > 0 else 0
            if density > 0.035: # Stuffing limit
                overused.append(skill)
                keyword_density_actions.append({
                    "priority": "high_priority",
                    "category": "keywords",
                    "message": f"Keyword stuffing detected: '{skill}' is repeated {count} times (density is high). Reduce density to under 3.5%."
                })
                
        # If missing critical skills, add priority actions
        for skill in list(missing_skills)[:3]:
            keyword_density_actions.append({
                "priority": "high_priority",
                "category": "keywords",
                "message": f"Critical technology missing: Add experience referencing '{skill}' to match job requirements."
            })
            
        return {
            "score": round(overall_jd, 2),
            "breakdown": {
                "skills_match": round(s_skills, 2),
                "tech_stack": round(s_tech, 2),
                "responsibilities": round(s_resp, 2),
                "experience": round(s_exp, 2),
                "education": round(s_edu, 2),
                "domain": round(s_domain, 2)
            },
            "keywords": {
                "present": list(matched_skills),
                "missing": list(missing_skills),
                "overused": overused
            },
            "action_items": keyword_density_actions,
            "candidate_experience_years": candidate_exp
        }

    @staticmethod
    def heuristically_calculate_experience(text: str) -> int:
        """Looks for dates (e.g. 2018 - 2024, 2021-Present) to estimate years of work."""
        years = re.findall(r'\b(19\d{2}|20\d{2})\b', text)
        if not years:
            return 2 # Fallback average
        
        int_years = [int(y) for y in years if 1980 < int(y) < 2030]
        if not int_years:
            return 2
            
        min_year = min(int_years)
        max_year = max(int_years)
        
        # If active present job is referenced, use current year (2026)
        if "present" in text.lower() or "current" in text.lower():
            max_year = 2026
            
        diff = max_year - min_year
        return max(1, min(25, diff))
        
    @classmethod
    def calculate_diagnostics(cls, resume_text: str) -> Dict[str, Any]:
        """Runs standard grammatical check simulations (double spaces, passive voices, simple counts)."""
        words = re.findall(r'\b\w+\b', resume_text)
        text_lower = resume_text.lower()
        
        # Simple checklist rules
        double_spaces = len(re.findall(r'\s{2,}', resume_text))
        passive_voice_words = ["was developed", "was built", "was managed", "was optimized", "were designed"]
        passive_count = sum([1 for p in passive_voice_words if p in text_lower])
        
        # Grammar Score formula
        deductions = double_spaces * 5 + passive_count * 8
        grammar_score = max(50.0, 100.0 - deductions)
        
        grammar_errors = []
        if double_spaces > 0:
            grammar_errors.append({
                "issue": "Double spacing detected",
                "occurrences": double_spaces,
                "suggestion": "Replace multiple blank spaces with a single space character."
            })
        if passive_count > 0:
            grammar_errors.append({
                "issue": "Passive voice detected",
                "occurrences": passive_count,
                "suggestion": "Rewrite sentences in active voice (e.g., use 'Built API' instead of 'API was built')."
            })
            
        return {
            "score": grammar_score,
            "errors": grammar_errors
        }
