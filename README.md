# AI Recruitment & Resume Intelligence Platform

> Next-Generation AI Recruitment Platform featuring automated resume parsing, explainable hybrid scoring (semantic embeddings + rule-based skill verification), recruiter pipelines, Kanban workflow, and skill gap intelligence.

---

## 🌟 Key Features

1. **Deterministic-First AI Extraction Pipeline**
   - Multi-stage PDF extraction with reading-order preservation (PyMuPDF / pdfplumber) and automatic OCR fallback (Tesseract).
   - Text cleaning, sectioning, date interval parsing with overlapping range merger for accurate experience calculation, and degree level mapping (0 to 4).
   - Curated skill taxonomy with 100+ canonical tech skills, aliases, and context-aware disambiguation rules (e.g. `Go`, `R`, `Swift`, `Spring`).

2. **Auditable & Explainable Hybrid Scoring**
   - Mathematical formula combining 4 transparent components:
     $$\text{Score} = 100 \times (0.40 \times \text{Semantic} + 0.35 \times \text{Skills} + 0.15 \times \text{Experience} + 0.10 \times \text{Education})$$
   - Sentence transformers (`sentence-transformers/all-MiniLM-L6-v2`) unit-normalized 384-dimensional embeddings stored in PostgreSQL with `pgvector`.
   - **Knockout Guardrails**: Missing mandatory recruiter skills cap the total score at 60 with explanation.
   - **Transferable Skill Credit**: Partial credit (0.5x) awarded for semantically related skills (e.g. PyTorch for TensorFlow).
   - Passage retrieval highlighting top 3 resume chunks most aligned with the job.

3. **Complete Role-Based Portals**
   - **Candidate Portal**: Drag-and-drop resume upload with live status polling, extracted skills editor, job recommendations with match badges, detailed score breakdown modals, and application tracking.
   - **Recruiter Portal**: Job posting with "Suggest Skills with AI" extraction, ranked applicant lists (sorted by match score), interactive Kanban pipeline stages, and applicant score inspection.
   - **Admin Intelligence Hub**: Platform KPIs, match score distribution histograms, top skills demand vs. supply charts, and skill taxonomy dictionary manager.

---

## 🏗 Architecture & Tech Stack

- **Backend API**: Django 5 + Django REST Framework + SimpleJWT
- **Database**: PostgreSQL 16 with `pgvector` extension (SQLite fallback for lightweight offline dev)
- **Async Processing**: Celery 5 + Redis broker & result backend
- **AI / NLP**: Pure Python `ai` package (PyMuPDF, pdfplumber, pytesseract, dateparser, sentence-transformers)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts
- **DevOps**: Docker, Docker Compose, Gunicorn, Nginx

---

## 🚀 Quickstart Guide

### Option 1: Running with Docker Compose (Recommended for Full Stack)

```bash
# 1. Clone repository
git clone <repo-url>
cd "AI Recruitment & Resume Intelligence Platform"

# 2. Copy environment template
cp .env.example .env

# 3. Spin up all containers (Postgres+pgvector, Redis, API, Celery Workers, Frontend, Mailhog)
docker compose up -d

# 4. Run migrations and seed taxonomy & demo data
docker compose exec api python manage.py migrate
docker compose exec api python manage.py seed_skills
docker compose exec api python manage.py seed_demo_data
```

Once running:
- **Frontend Web App**: `http://localhost:5173`
- **Backend API & Swagger Docs**: `http://localhost:8000/api/docs/`
- **MailHog (Dev Emails)**: `http://localhost:8025`

---

### Option 2: Local Development (Without Docker)

#### 1. Backend Setup
```bash
cd backend
# Create and activate Python virtual environment
py -3.12 -m venv venv
venv\Scripts\activate

# Install requirements
pip install -r requirements/dev.txt

# Run migrations and seed data
python manage.py migrate
python manage.py seed_skills
python manage.py seed_demo_data

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

#### 2. Frontend Setup
```bash
cd frontend
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173`.

---

## 🔑 Pre-seeded Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Candidate** | `candidate@recruitai.com` | `password123` |
| **Recruiter** | `recruiter@recruitai.com` | `password123` |
| **Admin** | `admin@recruitai.com` | `password123` |

You can also use the one-click profile switcher on the login page.

---

## 🧪 Testing

Run backend unit and pipeline integration tests:
```bash
python backend/manage.py test tests
```
