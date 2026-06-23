# Implementation Roadmap & Risk Matrix

This document provides a detailed multi-phase roadmap, team sizing suggestions, complexity estimation, and risk mitigations for building the ATS platform from scratch.

---

## 1. Phased Development Roadmap

The platform development is split into five distinct phases, moving from core document parsing to multi-agent LLM reasoning, scaling, enterprise integrations, and post-production feedback loops.

```
Phase 1: MVP Core (M1-M2) ──────> Phase 2: AI Agents (M3-M4) ──────> Phase 3: Scale (M5-M6) ──────> Phase 4: Enterprise (M7-M8) ──────> Phase 5: Feedback (M9-M10)
```

---

### Phase 1: MVP Core System (Months 1–2)
*   **Focus**: Base platform architecture, database migrations, file storage, and deterministic document parsing.
*   **Deliverables**:
    *   S3 upload endpoints with temporary pre-signed token authorization.
    *   Text extraction pipeline (PyMuPDF for PDFs + python-docx for Word files).
    *   Lexical keyword matcher (exact match algorithm + category classification).
    *   Deterministic score calculations (ATS formatting penalties and exact keyword ratios).
*   **Team Size**: 2 Backend Engineers, 1 Frontend Engineer.
*   **Complexity**: Medium.
*   **Key Risks**: Legacy parser errors due to unstructured PDF structures.
    *   *Mitigation*: Implement standard document cleaning rules to normalize layout streams prior to running classifiers.

---

### Phase 2: Multi-Agent AI Optimizers (Months 3–4)
*   **Focus**: Integrating agentic LLM analysis for rewrite recommendations, grammar, and career coaching.
*   **Deliverables**:
    *   LangGraph multi-agent orchestrator setup.
    *   Bullet Point Improvement Engine (quantified achievement rewrites using the XYZ formula).
    *   Grammar Diagnostics Agent and formatting visual auditor.
    *   Career Coach prioritization pipeline (`Must Fix` vs `Nice to Have`).
*   **Team Size**: 1 LLM Engineer, 1 Backend Engineer, 1 Frontend Engineer.
*   **Complexity**: High.
*   **Key Risks**: High token latency (P95 > 12s) and high operational costs.
    *   *Mitigation*: Implement context slicing; pass only the relevant sections of the resume to each agent, rather than the entire document.

---

### Phase 3: High Performance Scaling & Analytics (Months 5–6)
*   **Focus**: Queueing systems, vector benchmarking databases, and caching integrations.
*   **Deliverables**:
    *   Kafka event stream topics configuration (`resume-uploads`, `llm-analysis-jobs`).
    *   Asynchronous parser execution models supported by WebSocket status updates.
    *   HNSW index building on pgvector tables for similarity matching.
    *   Redis VL semantic cache integration for bullet optimizations.
*   **Team Size**: 1 DevOps/SRE Engineer, 1 Database/Backend Engineer.
*   **Complexity**: High.
*   **Key Risks**: Consumer group lag spikes during load events.
    *   *Mitigation*: Configure Kubernetes HPAs to scale processing pods dynamically based on Kafka consumer lag metrics.

---

### Phase 4: Enterprise Integrations & Compliance (Months 7–8)
*   **Focus**: Multi-tenancy, Row-Level Security, SAML SSO, and ATS integrations.
*   **Deliverables**:
    *   PostgreSQL Row Level Security (RLS) enforcement.
    *   ATS webhooks integration (Greenhouse, Lever, Workday).
    *   SAML SSO and multi-tenant billing models (Stripe subscription tiers).
    *   PII stripping pre-processing workers.
*   **Team Size**: 2 Integration Engineers, 1 Security Engineer.
*   **Complexity**: Medium.
*   **Key Risks**: Unauthorized access across tenant workspaces.
    *   *Mitigation*: Write integration tests that verify database queries fail if they don't match the current tenant ID header context.

---

### Phase 5: Feedback Loop & Adaptive Score Calibration (Months 9–10)
*   **Focus**: dynamic weight updates and score refinement.
*   **Deliverables**:
    *   Candidate success tracking loops (e.g. feedback on whether the resume led to an interview).
    *   Adaptive score calibration: automatically adjusting parser scoring weights based on actual hiring outcomes.
    *   Dashboard analytics to track application outcomes.
*   **Team Size**: 1 Data Scientist, 1 Backend Developer.
*   **Complexity**: Medium.
*   **Key Risks**: Calibration bias from low feedback volume.
    *   *Mitigation*: Use a baysian update algorithm with highly conservative limits on parameter shifts.

---

## 2. Key Architectural Risk Matrix

| Risk Identified | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **LLM Call Failures & Latency** | Critical | High | Implement asynchronous processing, local retries, fallback models (e.g. swap from Claude 3.5 Sonnet to GPT-4o-mini for simple checks), and Redis semantic caching. |
| **ATS Parsing Mismatches** | High | High | Run structural evaluations using standard layout heuristics to identify and warn users about complex elements (like nested tables or columns) *before* parsing. |
| **Vector DB Query Bottlenecks** | High | Low | Use pgvector HNSW indexing configured for Cosine distance metrics, deploy PgBouncer connection pooling, and maintain scale limits on candidate vector datasets. |
| **Security & PII Compliance** | Critical | Medium | Enforce Row-Level Security (RLS) policies, deploy AES-256 S3 bucket encryption with AWS KMS keys, and strip PII markers at the edge using regex pre-processors. |
