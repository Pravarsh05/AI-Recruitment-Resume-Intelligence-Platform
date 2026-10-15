# AI Recruitment & Resume Intelligence Platform: Implementation Plan

## 1. Project Overview

**Goal:** A web platform where candidates upload resumes (PDF), the system extracts text and skills automatically, and recruiters post jobs. The platform scores each resume against each job, explains the score, and flags missing skills. Both sides get dashboards, and admins get analytics.

**Primary users**

| Role | Needs |
|---|---|
| Candidate | Register, upload resume, see extracted profile, browse jobs, see match score and gaps, apply, track applications |
| Recruiter | Post and manage jobs, see ranked applicants with explanations, move applicants through a pipeline |
| Admin | Manage users and the skill taxonomy, view platform analytics, monitor AI/pipeline health |

**Tech stack**

| Layer | Choice |
|---|---|
| Backend API | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 with the `pgvector` extension |
| Async work | Celery 5 + Redis (broker and cache) |
| Frontend | React 18 + TypeScript + Vite, TanStack Query, React Router, Tailwind CSS |
| Auth | JWT (`djangorestframework-simplejwt`) with refresh rotation |
| AI/NLP | PyMuPDF/pdfplumber, Tesseract OCR, spaCy, sentence-transformers, optional LLM |
| Vector search | pgvector (primary). FAISS only as an optional benchmark |
| Containers | Docker + Docker Compose |
| Cloud | AWS (ECS Fargate, RDS, ElastiCache, S3, CloudFront, ALB). Equivalent on GCP/Azure |
| CI/CD | GitHub Actions |

**Out of scope for v1:** video interviews, in-app messaging, payments, multi-language resumes (English only), and resume rewriting.

---

## 2. Architecture

```
React SPA (CloudFront + S3)
        |  HTTPS / JSON (JWT)
        v
   ALB --> Django + DRF (Gunicorn, ECS service "api")
              |        |         \
              |        |          \--> S3 (resume PDFs, presigned URLs)
              |        v
              |     Redis  <---- Celery workers (ECS service "worker")
              v                         |
        PostgreSQL + pgvector <---------+
        (RDS)                           |
                                        +--> Embedding model (loaded in worker)
                                        +--> Optional LLM API (extraction / explanation polish)
        Celery beat (ECS service "beat") --> scheduled jobs (re-scoring, analytics rollups, cleanup)
```

**Design principles**

1. **The API never does heavy work.** Uploads return `202` immediately. Parsing, embedding, and scoring run in Celery.
2. **Deterministic first, LLM second.** Skill extraction and scoring are rule-based and embedding-based, so results are reproducible and explainable. The LLM is an optional enhancer, never the source of facts.
3. **Every score is stored with its breakdown** so explanations are auditable and can be recomputed when the algorithm version changes.
4. **One database.** Relational data and vectors live in PostgreSQL, so filters and vector search combine in one query.
5. **Modular monolith.** One Django project with clear app boundaries. No microservices for v1.

---

## 3. Repository Structure

```
recruit-ai/
├── backend/
│   ├── manage.py
│   ├── config/                  # settings (base/dev/prod), urls, celery.py, asgi/wsgi
│   ├── apps/
│   │   ├── accounts/            # User, auth, roles, permissions
│   │   ├── candidates/          # CandidateProfile, Education, Experience
│   │   ├── resumes/             # Resume upload, status, parsed data
│   │   ├── skills/              # Skill taxonomy, aliases, categories
│   │   ├── jobs/                # Job postings, required/preferred skills
│   │   ├── applications/        # Application + status history
│   │   ├── matching/            # Scoring engine, explanations, MatchResult
│   │   ├── analytics/           # Aggregations, admin endpoints
│   │   └── core/                # shared mixins, pagination, exceptions, audit log
│   ├── ai/                      # framework-independent AI package
│   │   ├── extraction/          # pdf_reader.py, ocr.py, cleaner.py, sectioner.py
│   │   ├── nlp/                 # skill_matcher.py, experience_parser.py, education_parser.py, titles.py
│   │   ├── embeddings/          # encoder.py, chunking.py
│   │   ├── scoring/             # components.py, weights.py, scorer.py
│   │   ├── explain/             # templates.py, llm_polish.py
│   │   └── eval/                # labeled pairs, metrics scripts
│   ├── tests/
│   ├── requirements/{base,dev,prod}.txt
│   └── Dockerfile
├── frontend/
│   ├── src/{api,auth,components,pages,hooks,routes,types}
│   ├── vite.config.ts
│   └── Dockerfile
├── infra/                       # Terraform (or CDK), nginx conf, task definitions
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/workflows/{ci.yml,deploy.yml}
├── docs/                        # ADRs, API docs, runbooks
└── Makefile
```

The `ai/` package is plain Python with no Django imports. This makes it unit-testable, reusable in notebooks, and easy to evaluate offline.

---

## 4. Data Model (PostgreSQL)

### 4.1 Core tables

**accounts_user**: `id`, `email` (unique), `password`, `role` (`candidate | recruiter | admin`), `is_active`, `email_verified`, `created_at`, `last_login`

**candidates_candidateprofile**: `user` (1:1), `full_name`, `phone`, `location`, `headline`, `summary`, `total_experience_years` (derived), `highest_education`, `open_to_work`, `primary_resume` (FK nullable)

**candidates_education / candidates_experience**: structured rows parsed from the resume (institution/degree/field/dates; company/title/start/end/description). Candidate-editable so parsing errors can be corrected.

**resumes_resume**: `id`, `candidate`, `file_key` (S3 key), `original_filename`, `file_size`, `sha256` (dedupe), `status` (`uploaded | extracting | extracted | parsing | embedded | failed`), `failure_reason`, `raw_text`, `clean_text`, `sections` (JSONB), `parsed_data` (JSONB: skills, titles, years, education), `parser_version`, `embedding vector(384)`, `uploaded_at`, `processed_at`

**resumes_resumechunk** (for passage-level explanation): `resume`, `section`, `text`, `embedding vector(384)`, `order`

**skills_skill**: `id`, `name` (canonical), `slug`, `category` (language, framework, database, cloud, tool, soft, domain), `aliases` (array), `is_active`, `embedding vector(384)` (used for related-skill hints)

**skills_candidateskill**: `candidate`, `skill`, `source_resume`, `confidence` (0 to 1), `years` (nullable), `evidence` (snippet), `is_confirmed` (candidate-verified)

**jobs_job**: `id`, `recruiter`, `company_name`, `title`, `description`, `location`, `work_mode` (`onsite | hybrid | remote`), `employment_type`, `min_experience_years`, `max_experience_years`, `education_required`, `salary_min`, `salary_max`, `status` (`draft | open | closed`), `parsed_data` (JSONB), `embedding vector(384)`, `created_at`, `closes_at`

**jobs_jobskill**: `job`, `skill`, `requirement` (`required | preferred`), `weight` (default 1.0), `is_mandatory` (bool, default false; a missing mandatory skill triggers the knockout cap in scoring)

**applications_application**: `id`, `job`, `candidate`, `resume` (snapshot of resume used), `status` (`applied | screening | shortlisted | interview | offer | hired | rejected | withdrawn`), `cover_note`, `applied_at`, `updated_at`. Unique on `(job, candidate)`.

**applications_statushistory**: `application`, `from_status`, `to_status`, `changed_by`, `note`, `changed_at`

**matching_matchresult**: `id`, `resume`, `job`, `score` (0 to 100), `semantic_score`, `skill_score`, `experience_score`, `education_score`, `matched_skills` (JSONB), `missing_required` (JSONB), `missing_preferred` (JSONB), `related_skills` (JSONB), `top_passages` (JSONB), `explanation` (text), `algorithm_version`, `computed_at`. Unique on `(resume, job, algorithm_version)`.

**core_auditlog**: `actor`, `action`, `object_type`, `object_id`, `metadata`, `created_at`

### 4.2 Indexes and constraints

- HNSW indexes on `resume.embedding`, `job.embedding`, `skill.embedding` using `vector_cosine_ops`.
- GIN index on `skill.aliases` and on `parsed_data` JSONB fields used in filters.
- B-tree on `(job, status)`, `(candidate, status)`, `(job, score DESC)` for the ranked-applicant query.
- Partial index on `job` where `status = 'open'`.
- Unique `sha256` per candidate to block duplicate uploads.

### 4.3 Migrations

Enable pgvector in a first migration (`CreateExtension("vector")`). Seed the skill taxonomy in a data migration or management command (`seed_skills`).

---

## 5. Authentication and Authorization

- **Registration:** `POST /api/auth/register/` with email, password, role (`candidate` or `recruiter` only; admins are created by command). Password validators on, with email verification via a signed token link (Celery sends the email).
- **Login:** `POST /api/auth/login/` returns an access token (15 min) and a refresh token (7 days). Refresh tokens rotate and the old one is blacklisted (`simplejwt.token_blacklist`).
- **Frontend storage:** access token in memory, refresh token in an `HttpOnly; Secure; SameSite=Lax` cookie. This avoids XSS theft from `localStorage`.
- **Permissions (DRF classes):** `IsCandidate`, `IsRecruiter`, `IsAdmin`, `IsJobOwner`, `IsResumeOwner`. Object-level checks everywhere. A recruiter can only see candidates who applied to their jobs, not browse all resumes.
- **Throttling:** DRF throttles on login, register, and upload (e.g. 5/min login, 10/hour upload).
- **Password reset:** token-based email flow.

---

## 6. REST API Design

Base path `/api/v1/`. Pagination via cursor or page number. Filtering via `django-filter`. OpenAPI schema via `drf-spectacular` (Swagger UI at `/api/docs/`).

### Auth and accounts
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register/` | Create account |
| POST | `/auth/login/`, `/auth/refresh/`, `/auth/logout/` | Session |
| POST | `/auth/verify-email/`, `/auth/password-reset/`, `/auth/password-reset/confirm/` | Account recovery |
| GET/PATCH | `/me/` | Current user and profile |

### Candidate
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/resumes/` | Upload PDF (multipart). Returns `202` + resume id |
| GET | `/resumes/` and `/resumes/{id}/` | List, status polling, parsed data |
| DELETE | `/resumes/{id}/` | Delete file, text, vectors (privacy) |
| POST | `/resumes/{id}/set-primary/` | Choose resume used by default |
| GET/PATCH | `/me/skills/` | View, confirm, add, remove extracted skills |
| GET | `/jobs/` | Browse open jobs with filters (skills, location, mode, experience) |
| GET | `/jobs/{id}/` | Job detail, includes the caller's match preview if a resume is embedded |
| GET | `/jobs/{id}/match/` | Match score and explanation for the caller's primary resume |
| GET | `/jobs/recommended/` | Top-N jobs by match for the caller |
| POST | `/jobs/{id}/apply/` | Apply (creates Application and triggers scoring if not cached) |
| GET | `/applications/mine/` | Candidate's applications and statuses |
| POST | `/applications/{id}/withdraw/` | Withdraw |

### Recruiter
| Method | Endpoint | Purpose |
|---|---|---|
| POST/GET | `/recruiter/jobs/` | Create, list own jobs |
| PATCH/DELETE | `/recruiter/jobs/{id}/` | Edit, close, delete |
| POST | `/recruiter/jobs/{id}/extract-skills/` | Suggest required/preferred skills from the description |
| GET | `/recruiter/jobs/{id}/applicants/` | Ranked applicants (sort by score, filter by status, min score) |
| GET | `/recruiter/applications/{id}/` | Application detail with full match breakdown |
| PATCH | `/recruiter/applications/{id}/status/` | Move through pipeline (writes history) |
| GET | `/recruiter/jobs/{id}/candidates/search/` | Semantic search over applicants (optional) |
| GET | `/recruiter/dashboard/` | Counts, funnel, recent activity |

### Admin
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/analytics/overview/` | Users, jobs, applications, uploads over time |
| GET | `/admin/analytics/matching/` | Score distribution, parse failure rate, avg processing time |
| GET | `/admin/analytics/skills/` | Top demanded skills (jobs) vs top supplied skills (resumes), plus skill gap |
| CRUD | `/admin/skills/` | Manage taxonomy and aliases |
| GET/PATCH | `/admin/users/` | Activate, deactivate, change role |
| POST | `/admin/matching/recompute/` | Trigger re-scoring after algorithm change |

**Conventions:** consistent error envelope `{ "error": { "code", "message", "fields" } }`, idempotency for apply, and ETag or `updated_at` for optimistic concurrency on job edits.

---

## 7. AI / NLP Pipeline (detailed)

### 7.1 Overview

```
Upload -> validate -> store (S3) -> Celery chain:
  extract_text -> clean_and_section -> extract_entities -> embed_resume -> (score vs open jobs)
```

Each stage updates `Resume.status`, so the frontend can poll or subscribe and show progress. Each stage is idempotent and retryable (`autoretry_for`, exponential backoff, `acks_late=True`).

### 7.2 Stage 1: Upload and validation
- Accept PDF only (also check magic bytes `%PDF`, not just the extension). Max 5 MB, max 10 pages.
- Compute SHA-256. If the same hash exists for the candidate, return the existing resume.
- Store in S3 with a random key. Never serve directly. Use short-lived presigned URLs.
- Optional virus scan with ClamAV in the worker before processing.

### 7.3 Stage 2: Text extraction
1. Try **PyMuPDF** (`fitz`) with block-level extraction preserving reading order. Fall back to **pdfplumber** if output is poor.
2. **Quality check:** if extracted characters per page is below a threshold (e.g. under 200), treat as scanned and run **OCR** (`pdf2image` + Tesseract, 300 DPI).
3. Handle multi-column layouts by sorting blocks by column then y-position (use block bounding boxes).
4. Persist `raw_text`.

### 7.4 Stage 3: Cleaning and sectioning
- Normalize unicode, fix hyphenated line breaks, collapse whitespace, strip headers/footers repeated across pages, normalize bullet characters.
- **Section detection:** regex over common headings (Summary, Experience, Work History, Education, Skills, Projects, Certifications, Achievements) with case and spacing variants, falling back to formatting cues (all-caps lines, short lines followed by blank). Output `sections: {name: text}`.
- Extract contact info with regex (email, phone, LinkedIn, GitHub). Used to prefill the profile, never for scoring, and PII is not sent to the LLM.

### 7.5 Stage 4: Skill and experience extraction

**Skill extraction (deterministic baseline)**
- **Taxonomy:** 1,500 to 3,000 curated skills with aliases (`k8s`, `kubernetes`; `js`, `javascript`; `postgres`, `postgresql`). Seed from open sources (e.g. ESCO, O*NET, GitHub linguist, Stack Overflow tags), then curate.
- **Matching:** spaCy `PhraseMatcher` on lowercased/lemmatized text plus word-boundary-safe regexes for symbol-heavy skills (`C++`, `C#`, `.NET`, `Node.js`).
- **Disambiguation:** handle ambiguous tokens (`Go`, `R`, `Swift`, `Spring`) with context rules (must appear in a Skills section or near tech co-occurring terms).
- **Confidence:** higher if found in Skills section and in Experience bullets. Lower if only mentioned once in passing.
- **Evidence:** store the sentence where each skill was found. This feeds the explanation UI.
- **Years per skill (best effort):** associate skills with the experience entries whose text mentions them and sum non-overlapping date ranges.

**Experience extraction**
- Parse date ranges (`Jan 2021 - Present`, `2019-2022`, `03/2020 to 08/2022`) with regex + `dateparser`. Treat "Present/Current" as today.
- Merge overlapping ranges to compute `total_experience_years` without double counting.
- Extract job titles via a title lexicon plus spaCy NER hints, and normalize them (e.g. "Sr. SWE" to "Senior Software Engineer").

**Education extraction**
- Degree keywords (B.Tech, BE, BSc, MSc, MBA, PhD, etc.) mapped to an ordinal level (0 none, 1 diploma, 2 bachelor, 3 master, 4 doctorate), plus field of study and institution.

**Optional LLM enhancement (feature-flagged)**
- Send the cleaned text (PII stripped) to an LLM with a strict JSON schema to catch skills outside the taxonomy and fix parsing of unusual layouts.
- Merge rules: baseline results are kept. LLM-only skills are added with lower confidence and flagged `source="llm"`. Anything not in the taxonomy goes to an admin review queue to grow the taxonomy.
- Cache by resume hash, and enforce a token/cost budget with timeouts and a fallback to baseline.

### 7.6 Stage 5: Embeddings
- **Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-d, fast, CPU-friendly). Upgrade path: `bge-small-en-v1.5` or `all-mpnet-base-v2` after offline evaluation. Record `embedding_model` and version so a model change triggers re-embedding.
- **What gets embedded:**
  - Whole-resume embedding built from a cleaned summary of: headline, summary, skills line, and experience text (truncated to the model window, or mean-pooled over chunks).
  - Chunk embeddings per section/bullet group for passage-level explanations.
  - Job embedding from title + description + requirements.
  - Skill embeddings (name + short description) for related-skill hints.
- Normalize vectors to unit length so cosine similarity equals dot product.
- Load the model once per worker process (`worker_process_init` signal). Batch encode.

### 7.7 Stage 6: Hybrid scoring

```
final = 100 * ( 0.40 * semantic
              + 0.35 * skill_overlap
              + 0.15 * experience_fit
              + 0.10 * education_fit )
```

| Component | Definition |
|---|---|
| **semantic** | Cosine similarity between resume and job embeddings, rescaled (e.g. map the observed 0.2 to 0.8 range to 0 to 1, calibrated on labeled data) |
| **skill_overlap** | `sum(weight of matched skills) / sum(weight of all job skills)`, required skills weight 2.0, preferred 1.0, with partial credit (0.5x) for semantically related skills above a similarity threshold |
| **experience_fit** | 1.0 if within `[min, max]`. Linear decay below the minimum (`years / min`). Gentle decay for over-qualification. 1.0 if the job states no requirement |
| **education_fit** | 1.0 if candidate level is at least the required level. 0.5 if one level below. 0.0 otherwise. 1.0 if none required |

**Rules and guardrails**
- **Knockout cap:** if a hard-required skill (flagged `is_mandatory` by the recruiter) is missing, cap the final score at 60 and show why.
- Weights live in config and are tied to `algorithm_version`, so any change creates a new version and results can be compared or recomputed.
- Scores are computed in `matching.services.score(resume, job)` and cached in `MatchResult`.

**When scoring runs**
- On application submit (sync-fast path or Celery task).
- When a candidate views a job (computed lazily and cached).
- Batch: after a resume finishes embedding, score against top-K open jobs retrieved by pgvector (`ORDER BY embedding <=> :vec LIMIT 200`), then rank by the full hybrid score for recommendations.
- When a recruiter edits a job's skills or description, invalidate and re-score its applicants (Celery).

### 7.8 Stage 7: Explanation generation

Built from the stored components, so every statement is traceable:

- **Summary line:** "82/100: strong match. Skills 88%, experience fits, education meets requirement."
- **Matched skills** with the evidence snippet from the resume.
- **Missing required / preferred skills**, ranked by weight.
- **Related-skill hints:** "Job wants TensorFlow. Resume shows PyTorch (similarity 0.78)."
- **Experience note:** "Job asks 3 to 5 years. Resume shows about 4.2 years."
- **Top passages:** the 2 to 3 resume chunks most similar to the job (pgvector chunk search), highlighted in the UI.
- **Score breakdown chart data:** the four component values for the radar/bar chart.
- **Optional LLM polish:** pass only the structured facts and ask for a 3-sentence natural-language rewrite. Validate that every skill mentioned appears in the structured input (reject and fall back to the template output otherwise).

### 7.9 Evaluation (build this early)
- Create a labeled set of 100 to 200 resume/job pairs with human relevance ratings (0 to 3), using public resume datasets, synthetic resumes, and your own.
- Metrics: skill-extraction precision/recall/F1 against hand-annotated resumes, ranking quality (NDCG@10, Spearman vs. human ratings) for the match score, parse success rate, and latency per stage.
- Use these to tune the weights, the semantic rescaling, and the related-skill threshold. Run the evaluation script in CI on a small fixture set to catch regressions.

---

## 8. Frontend (React + TypeScript)

### 8.1 Foundations
- Vite, React Router v6, TanStack Query (server state), Zustand or context (auth/UI state), React Hook Form + Zod (forms and validation), Axios with an interceptor that refreshes tokens and retries once, Tailwind plus a component kit (shadcn/ui), Recharts for charts.
- Route guards by role (`<RequireRole role="recruiter">`). Code-split per role area.
- Generated API types from the OpenAPI schema (`openapi-typescript`), so the front end and back end stay in sync.

### 8.2 Pages

**Public:** landing, login, register (role choice), verify email, forgot/reset password.

**Candidate**
- *Dashboard:* profile completeness, resume status card, recommended jobs with score badges, application status summary, top missing skills across saved/applied jobs.
- *Resume page:* drag-and-drop upload with progress, live processing status (polling every 2 s while not `embedded`), extracted-data review (skills editable and confirmable, experience, education), preview, replace/delete.
- *Jobs:* search and filters, job cards showing match percentage, job detail with score breakdown chart, matched vs. missing skills, and "how to improve" hints, plus an Apply button.
- *Applications:* table with status timeline per application.
- *Profile settings:* account, privacy (delete data).

**Recruiter**
- *Dashboard:* open jobs, applicants per job, pipeline funnel, average match score, recent applications.
- *Job editor:* form with description, skill picker, an "Suggest skills from description" button (calls extract-skills), required/preferred/mandatory toggles, draft/publish.
- *Applicant list:* ranked table (score, key matched skills, missing skills count, status), filters (min score, status, experience), bulk status updates.
- *Applicant detail:* resume viewer (presigned URL), full explanation panel, passage highlights, status change with notes, history timeline.
- *Kanban pipeline:* drag applicants across stages (`dnd-kit`).

**Admin**
- *Analytics:* KPI cards, time-series charts, score distribution histogram, top skills demand vs. supply, parse failure rate, queue depth.
- *Skill taxonomy manager:* search, edit aliases, review queue for LLM-suggested skills.
- *Users:* list, deactivate, change role.

### 8.3 UX details
Skeleton loaders, empty states, optimistic updates for status changes, accessible components (keyboard and ARIA), responsive layout, toast notifications, and error boundaries.

---

## 9. Async Processing (Celery + Redis)

| Queue | Tasks | Notes |
|---|---|---|
| `default` | emails, notifications, cache invalidation | quick |
| `ingest` | `extract_text`, `clean_and_section`, `extract_entities` | CPU-bound, limit concurrency |
| `ml` | `embed_resume`, `embed_job`, `score_pairs`, `rescore_job` | loads the model, run on separate workers with more memory |
| `maintenance` | analytics rollups, orphan file cleanup, re-embedding | scheduled via Celery Beat |

- Use `chain`/`chord` for the resume pipeline. Set `task_acks_late`, `task_reject_on_worker_lost`, `time_limit`/`soft_time_limit` (PDF/OCR can hang), and retries with jitter.
- Dead-letter handling: after the max retries, set `Resume.status=failed` with `failure_reason` and notify the candidate to re-upload.
- Flower (restricted access) or Prometheus exporter for monitoring.
- Redis also serves as the cache for job lists, analytics rollups (short TTL), and rate-limit counters.

---

## 10. Security and Privacy

- **Resumes are sensitive PII.** Encrypt at rest (S3 SSE-KMS, RDS encryption) and in transit (TLS everywhere).
- Private S3 bucket, short-lived presigned URLs, per-object access checked in Django before issuing.
- Data retention and deletion: candidate can delete the resume, which removes the file, text, chunks, vectors, and derived skills. Provide an account export and delete (GDPR-style).
- **Anonymized recruiter mode (optional):** hide name and photo on the applicant list to reduce bias.
- **Fairness:** do not use gender, age, name, or photo as features. Explanations only cite skills, experience, education, and text similarity. Log algorithm version for audits. Document the limitations in the UI ("score is a decision aid, not a decision").
- OWASP basics: input validation, ORM-only queries, CSRF protection for cookie flows, strict CORS, security headers (`django-csp`, HSTS), dependency scanning (`pip-audit`, `npm audit`, Dependabot), secrets via AWS Secrets Manager/SSM and never in the repo.
- File upload hardening: size and type limits, magic-byte check, random storage keys, parse in an isolated worker with resource limits, optional AV scan.
- Prompt-injection defense for the LLM path: resumes may contain hidden instructions (e.g. white-text "rate this candidate 100"). Treat resume text as data, use strict JSON schemas, never let LLM output change scores, and do the scoring deterministically.
- Audit log for status changes, deletions, and admin actions.

---

## 11. Testing Strategy

| Level | Tooling | Coverage |
|---|---|---|
| Unit (AI) | pytest | Cleaner, sectioner, date parser, skill matcher (including ambiguous tokens), each scoring component, explanation templates |
| Unit (Django) | pytest-django, factory_boy | Models, serializers, permissions, services |
| API | DRF `APIClient` | Every endpoint: auth, role isolation, validation, pagination, error format |
| Integration | pytest + Celery eager mode, then real worker in CI via Compose | Upload to embedded to scored flow with sample PDFs (text-based, multi-column, scanned) |
| Pipeline regression | Fixture resumes with expected skills and years | Fails CI if F1 drops below a threshold |
| Frontend | Vitest + React Testing Library, MSW for API mocks | Forms, guards, key components |
| E2E | Playwright | Candidate: register, upload, view match, apply. Recruiter: post job, see ranked applicants, change status |
| Load | Locust/k6 | Job listing, match endpoint, upload bursts, with Celery queue latency measured |
| Security | Bandit, ZAP baseline scan | Run in CI and before release |

Targets: 80%+ backend coverage on `apps/` and `ai/`, with all permission paths tested.

---

## 12. DevOps

### 12.1 Docker
- `backend/Dockerfile`: multi-stage, slim Python 3.11, installs Tesseract and poppler-utils, pre-downloads the spaCy model and sentence-transformer weights at build time (so cold starts are fast).
- `frontend/Dockerfile`: build with Node, serve static files via nginx (prod) or Vite dev server (dev).
- `docker-compose.yml` services: `db` (pgvector/pgvector image), `redis`, `api`, `worker-ingest`, `worker-ml`, `beat`, `frontend`, `mailhog` (dev email), optional `flower`. Healthchecks and `depends_on` conditions on each.

### 12.2 CI (GitHub Actions)
On every PR: lint (ruff, black check, mypy, eslint, tsc), backend tests with Postgres+pgvector and Redis service containers, AI regression eval on fixtures, frontend tests, build both images, security scans.

### 12.3 CD
On merge to `main`: build and push images to ECR, run migrations as a one-off ECS task, deploy to staging, run smoke tests, then manual approval for production with a rolling deploy and automatic rollback on failed health checks.

### 12.4 Cloud deployment (AWS reference)
- **Network:** VPC with public subnets (ALB) and private subnets (ECS, RDS, ElastiCache), NAT for egress.
- **Compute:** ECS Fargate services `api` (2+ tasks), `worker-ingest`, `worker-ml` (more CPU/RAM), `beat` (1 task). Autoscale workers on queue depth and the API on CPU/requests.
- **Data:** RDS PostgreSQL (Multi-AZ in prod, pgvector enabled, automated backups plus PITR), ElastiCache Redis, S3 for resumes (versioning, lifecycle rules) and for the front-end build.
- **Edge:** CloudFront + S3 for the React app, ALB for `/api`, ACM certificates, Route 53 DNS, WAF with rate rules.
- **IaC:** Terraform modules for network, database, ECS, S3/CloudFront, IAM. Separate `staging` and `prod` workspaces.
- **Config:** 12-factor env vars from SSM/Secrets Manager, with `DJANGO_SETTINGS_MODULE` per environment.
- **Cheaper alternative for the portfolio:** a single VM (or Render/Railway/Fly.io) running Docker Compose behind Caddy/nginx with managed Postgres. Same images, simpler infra.

### 12.5 Observability
- Structured JSON logging with request IDs propagated into Celery tasks, Sentry for errors (backend and frontend), Prometheus/Grafana or CloudWatch metrics and dashboards.
- Key metrics: request latency, error rate, queue depth and task duration per stage, parse failure rate, embedding latency, average match score.
- Alerts: failure rate spike, queue backlog, DB connections/CPU, disk, certificate expiry.
- Backups: daily DB snapshot, restore drill documented in a runbook.

---

## 13. Performance and Scalability Notes

- pgvector with HNSW handles hundreds of thousands of vectors comfortably. Tune `ef_search` for recall vs. speed. If you ever outgrow it, benchmark FAISS or a dedicated vector DB, but not before.
- Use `select_related`/`prefetch_related`, pagination everywhere, and DB-level aggregation for dashboards. Add materialized views or nightly rollup tables for admin analytics.
- Cache job lists and recommended-jobs results with short TTLs, and invalidate on job changes.
- Keep embedding batches small enough to avoid memory spikes. Limit worker concurrency by memory, not CPU count.
- Recommendations: retrieve top-K by vector similarity first (cheap), then compute the full hybrid score only on those candidates.

---

## 14. Implementation Phases (ordered, with deliverables and acceptance criteria)

### Phase 0: Foundation
- **Do:** Create the repo, Docker Compose (Postgres+pgvector, Redis), Django project with split settings, DRF, Celery wiring, lint/format/pre-commit, CI skeleton, `.env` handling, Makefile.
- **Done when:** `docker compose up` starts all services, a health endpoint responds, a test Celery task runs, and CI is green.

### Phase 1: Accounts and auth
- **Do:** Custom user model with roles, register/login/refresh/logout, email verification and password reset, permission classes, throttling, audit log mixin. React app shell with auth flow, protected routes, role-based layout.
- **Done when:** Candidate and recruiter can register, log in, and see their empty dashboards. Cross-role access is denied (tested).

### Phase 2: Skill taxonomy
- **Do:** `Skill` model with aliases, seed command with the initial taxonomy, admin CRUD, `PhraseMatcher` builder with cache, ambiguity rules, unit tests.
- **Done when:** Matcher achieves the target precision/recall on a hand-annotated sample of about 30 resumes.

### Phase 3: Resume ingestion
- **Do:** Upload endpoint with validation and S3 (MinIO locally), the Celery chain for extraction, OCR fallback, cleaning, sectioning, contact extraction, status tracking, the front-end upload UI with live status, and failure handling.
- **Done when:** Text PDFs, two-column PDFs, and scanned PDFs all reach `extracted` with sensible text. Failures surface a clear message.

### Phase 4: Entity extraction
- **Do:** Skill extraction with confidence and evidence, experience/date parsing and merging, education parsing, title normalization, candidate profile auto-population, review/edit UI for extracted data, optional LLM enhancement behind a feature flag.
- **Done when:** The regression fixtures pass the F1 threshold. Candidates can confirm and correct skills, and corrections persist.

### Phase 5: Jobs
- **Do:** Job CRUD for recruiters, skill picker with required/preferred/mandatory, "suggest skills from description", job embedding task, public job browse with filters and search, and job detail page.
- **Done when:** A recruiter can publish a job with structured skills and an embedding. Candidates can filter and view it.

### Phase 6: Embeddings and matching engine
- **Do:** Encoder service, chunking, resume and chunk embeddings, pgvector indexes, the four scoring components, knockout cap, `MatchResult` caching and versioning, the match endpoint, and the recommended-jobs query (vector retrieval then hybrid re-rank).
- **Done when:** Scores are reproducible, breakdowns sum correctly, recommended jobs return in under about 500 ms for the seeded dataset, and unit tests cover each component's edge cases.

### Phase 7: Explanations and missing skills
- **Do:** Template explanation generator, missing required/preferred ranking, related-skill hints, top-passage retrieval, optional validated LLM polish, front-end breakdown chart, matched/missing skill chips, and "how to improve" suggestions.
- **Done when:** Every explanation statement can be traced to stored data. The LLM path never introduces unsupported skills (validated by test).

### Phase 8: Applications and recruiter workflow
- **Do:** Apply flow (idempotent, snapshots the resume, triggers scoring), status pipeline with history, ranked applicant list with filters, applicant detail with presigned resume view, Kanban board, candidate application tracking and withdraw, status-change emails.
- **Done when:** The end-to-end candidate-to-recruiter flow works, with permissions verified, and history is recorded.

### Phase 9: Dashboards and admin analytics
- **Do:** Candidate and recruiter dashboard endpoints and UIs, admin analytics (overview, matching quality, skills supply vs. demand), rollup tasks and caching, user management and skill review queue.
- **Done when:** The dashboards load fast (under about 1 s) on seeded large data. Admin charts match the database counts (tested).

### Phase 10: Evaluation and tuning
- **Do:** Build the labeled set, evaluation scripts (extraction F1, NDCG, Spearman), tune the weights, semantic rescaling, related-skill threshold, and compare embedding models. Bump `algorithm_version` and run the recompute.
- **Done when:** Metrics are documented in `docs/evaluation.md`, with chosen parameters justified and the CI regression gate set.

### Phase 11: Hardening
- **Do:** Security review against the checklist in section 10, rate limits, load tests, query optimization (`EXPLAIN ANALYZE`), accessibility pass, error handling and edge cases, privacy features (delete and export), and the anonymized mode if desired.
- **Done when:** There are no high-severity scanner findings, load targets are met, and the delete flow is verified to purge files and vectors.

### Phase 12: Deployment and launch
- **Do:** Terraform for staging and production, CI/CD pipeline, domain and TLS, monitoring and alerts, backups and restore drill, runbooks, seed demo data, and final documentation.
- **Done when:** A merge to `main` deploys to staging automatically, production deploys after approval with rollback tested, and dashboards and alerts are live.

---

## 15. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| PDF parsing quality varies wildly | Multiple extractors, OCR fallback, quality heuristics, a clear failure state, and a fixture library of ugly PDFs |
| Skill taxonomy gaps | LLM-suggested skills into an admin review queue, alias management, and periodic taxonomy updates from job data |
| Embedding similarity is misleading (e.g. high score from generic text) | Hybrid scoring, calibration on labeled data, and the knockout cap |
| Model size and memory in workers | Small model, load once per process, separate `ml` queue and workers, and a memory-based concurrency limit |
| Algorithmic bias and trust | Limit features, transparent explanations, versioned scoring, "decision aid" disclaimer, optional anonymized mode |
| LLM cost, latency, hallucination, injection | Feature flag, caching, budget caps, strict schema validation, scoring never depends on LLM output |
| Scope creep | Treat Phases 0 to 8 as the MVP. Phases 9 to 12 are for polish and production |
| Data leakage of PII | Encryption, least-privilege IAM, access checks before presigned URLs, PII stripping before external API calls, audit logs |

---

## 16. Definition of Done (project level)

- A candidate can register, upload a resume, review extracted skills, see ranked job recommendations with explained scores and missing skills, apply, and track status.
- A recruiter can post a job, see ranked applicants with explanations, and manage the pipeline.
- An admin can view analytics and manage the taxonomy and users.
- All services run via Docker Compose locally and are deployed to the cloud with CI/CD, monitoring, and backups.
- Test coverage and the AI evaluation metrics are documented and enforced in CI.
- README, architecture diagram, API docs, evaluation report, and runbooks are complete.

---

## 17. Suggested Resume and Portfolio Highlights

- Hybrid explainable matching (semantic + rule-based) with a documented evaluation (NDCG, F1).
- Async ML pipeline with Celery, retries, and observability.
- pgvector HNSW retrieval with SQL-filtered hybrid queries.
- Privacy and fairness design (deletion, anonymized mode, no sensitive features).
- Full IaC and CI/CD on AWS.
