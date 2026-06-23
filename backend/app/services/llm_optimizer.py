import os
import random
# pyrefly: ignore [missing-import]
from openai import OpenAI
from typing import Dict, Any, List

class LLMOptimizerService:
    @classmethod
    def optimize_bullet_point(cls, original_text: str, target_role: str, target_company: str = "") -> Dict[str, Any]:
        """Rewrites a weak bullet point into a strong quantified achievement."""
        # Try Live LLM rewriting if OpenAI API key is configured in the environment
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            try:
                client = OpenAI(api_key=api_key)
                prompt = (
                    f"You are a Senior Staff Technical Resume Writer. Optimize the following weak resume bullet point into the "
                    f"Google XYZ Formula format: 'Accomplished [X] as measured by [Y], by doing [Z]'.\n"
                    f"Target Role: {target_role}\n"
                    f"Target Company: {target_company if target_company else 'Tier 1 Tech Company'}\n"
                    f"Original Bullet Point: \"{original_text}\"\n\n"
                    f"Format your response as a strict JSON object with these keys:\n"
                    f"- 'improved': the optimized version\n"
                    f"- 'weakness_score': a score from 0-100 indicating how weak the original was (higher is weaker)\n"
                    f"- 'reasons': list of string reasons explaining why the original was weak."
                )
                
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a professional resume writer who outputs strict JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                
                import json
                result = json.loads(response.choices[0].message.content)
                return {
                    "original": original_text,
                    "improved": result.get("improved", original_text),
                    "weakness_score": int(result.get("weakness_score", 50)),
                    "reasons": result.get("reasons", ["Lacks specific quantified metrics"])
                }
            except Exception:
                # LLM execution failed (e.g. rate limit, bad API key), fallback to dynamic generator below
                pass

        # Call smart dynamic heuristic generator
        return cls.generate_heuristic_rewrite(original_text, target_role)

    @classmethod
    def generate_heuristic_rewrite(cls, text: str, role: str) -> Dict[str, Any]:
        """Dynamically parses input text and builds a customized Google XYZ resume sentence."""
        reasons = []
        weakness_score = 40
        
        text_lower = text.lower().strip().rstrip(".")
        
        # 1. Strip common weak prefixes to find the target object
        weak_prefixes = [
            "worked on backend development", "worked on backend", "worked on frontend development", "worked on frontend",
            "worked on", "helped with", "helped to", "helped", 
            "developed apis for", "developed apis", "developed", 
            "responsible for managing", "responsible for", "managing",
            "wrote unit tests for", "wrote unit tests", "wrote",
            "assisted with", "assisted", "managed", "built"
        ]
        
        object_phrase = text_lower
        for prefix in weak_prefixes:
            if text_lower.startswith(prefix):
                object_phrase = text_lower[len(prefix):].strip()
                break
                
        # Clean prefix prepositions
        if object_phrase.startswith("for "):
            object_phrase = object_phrase[4:].strip()
        elif object_phrase.startswith("with "):
            object_phrase = object_phrase[5:].strip()
            
        if not object_phrase:
            object_phrase = "core system components"

        # 2. Match context (DB, UI, API, testing, or General)
        if "test" in text_lower or "quality" in text_lower:
            action = "Spearheaded design of"
            object_phrase = object_phrase if object_phrase != "core system components" else "automated testing pipelines"
            metrics = [
                "boosting overall code coverage from 60% to 88% and eliminating 25% of regression defects",
                "saving 8+ engineering hours per release cycle and ensuring 94% deployment stability",
                "minimizing critical user-reported bugs by 35% across production environments"
            ]
        elif "db" in text_lower or "database" in text_lower or "sql" in text_lower or "postgres" in text_lower:
            action = "Optimized"
            object_phrase = object_phrase if object_phrase != "core system components" else "production database instances"
            metrics = [
                "reducing read/write query latency by 42% for over 1.5M active users",
                "scaling transaction throughput by 30% and cutting index lookup times from 80ms to under 12ms",
                "optimizing index schemas and cutting monthly cloud storage overhead by 20%"
            ]
        elif "style" in text_lower or "front" in text_lower or "react" in text_lower or "ui" in text_lower or "css" in text_lower:
            action = "Designed"
            object_phrase = object_phrase if object_phrase != "core system components" else "responsive frontend interfaces"
            metrics = [
                "improving Core Web Vitals performance scores by 35% and increasing retention by 15%",
                "reducing client initial load times by 1.2s and boosting conversion rates by 8%",
                "modularizing styling configurations to accelerate UI deployment speeds by 20%"
            ]
        elif "api" in text_lower or "rest" in text_lower or "service" in text_lower or "backend" in text_lower:
            action = "Architected"
            object_phrase = object_phrase if object_phrase != "core system components" else "RESTful API microservices"
            metrics = [
                "handling 50K+ peak concurrent requests and reducing average server response time by 30ms",
                "driving a 40% improvement in API query throughput and scaling database ingestion speed",
                "reducing system failures by 45% using circuit-breakers and distributed cache layers"
            ]
        else:
            action = "Engineered"
            metrics = [
                "boosting overall systems efficiency by 25% and resolving major performance bottlenecks",
                "saving 15% in infrastructure costs and supporting a 2.5x growth in transaction volume",
                "improving modular clean-code standards and lowering overall technical debt indices by 18%"
            ]
            
        # 3. Pick random metric and build
        metric_impact = random.choice(metrics)
        
        # Upper-case acronym tokens for professional readability
        acronyms = ["api", "apis", "db", "sql", "ui", "ux", "rest", "crud", "grpc"]
        object_words = object_phrase.split()
        for i, word in enumerate(object_words):
            if word.lower() in acronyms:
                object_words[i] = word.upper()
        object_phrase = " ".join(object_words)
        
        improved_template = f"{action} {object_phrase}, {metric_impact}."
        
        # 4. Run Heuristic audit checks
        has_numbers = any(char.isdigit() for char in text)
        if not has_numbers:
            reasons.append("Lacks specific quantitative metrics (percentages, numbers, values)")
            weakness_score += 15
        
        weak_starters = ["worked", "assisted", "responsible", "managed", "developed", "helped", "wrote"]
        words = text.split()
        if words and words[0].lower() in weak_starters:
            reasons.append(f"Starts with generic verb '{words[0]}'. Use stronger power verbs (e.g. Engineered, Architected)")
            weakness_score += 10
            
        if len(words) < 7:
            reasons.append("Description is too brief to indicate business value")
            weakness_score += 15
            
        weakness_score = min(95, weakness_score)
        
        return {
            "original": text,
            "improved": improved_template,
            "weakness_score": weakness_score,
            "reasons": reasons if reasons else ["Add more technical scale details"]
        }
