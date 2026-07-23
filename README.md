# CampusIQ AI — Enterprise Academic Intelligence Platform

> AI-powered academic intelligence platform for universities with predictive analytics, ML-driven insights, and role-based dashboards.

---

## Architecture Overview

```
CampusIQ AI
├── backend/          FastAPI + SQLAlchemy + ML
├── frontend/         React + TypeScript + Tailwind CSS
├── etl/              ETL pipeline (Excel → MySQL)
├── ml/               ML model training scripts
├── ai/               RAG / AI assistant
├── database/         MySQL init scripts
├── scripts/          Setup & training scripts
├── tests/            Unit + API tests
├── storage/          Models, reports, uploads
├── docs/             Documentation
└── docker-compose.yml
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local dev)
- Node.js 20+ (for local frontend dev)
- MySQL 8.0 (if running locally)

### 1. Clone & Configure

```bash
git clone <repo>
cd CAMPUS_IQ_AI
cp backend/.env.example backend/.env
# Edit backend/.env with your settings
```

### 2. Place Dataset

```
storage/uploads/CampusIQ_20000_Students_Dataset.xlsx
```

### 3. Docker Deployment (Recommended)

```bash
docker-compose up --build -d
```

Services:
- Frontend: http://localhost:80
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- MySQL: localhost:3306

### 4. Local Development

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # configure DB
uvicorn app.main:app --reload --port 8000
```

**Run Setup + ETL:**
```bash
python scripts/setup.py --dataset storage/uploads/CampusIQ_20000_Students_Dataset.xlsx
```

**Train ML Models:**
```bash
python scripts/train_models.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Default Credentials

| Role      | Username    | Password        |
|-----------|-------------|-----------------|
| Admin     | admin       | Admin@123       |
| Principal | principal   | Principal@123   |
| Faculty   | faculty1    | Faculty@123     |
| Student   | stu00001    | Student@123     |

---

## API Documentation

Interactive API docs available at: `http://localhost:8000/api/docs`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Login |
| GET | /api/v1/students | List students (paginated) |
| GET | /api/v1/analytics/kpis | Institution KPIs |
| GET | /api/v1/analytics/departments | Department analytics |
| POST | /api/v1/predictions/student/{id} | Run AI prediction |
| GET | /api/v1/predictions/at-risk | At-risk students |
| POST | /api/v1/chatbot/chat | AI chatbot |
| GET | /api/v1/reports/student/{id}/pdf | Download PDF report |
| POST | /api/v1/admin/import-dataset | Import Excel dataset |
| POST | /api/v1/admin/train-models | Train ML models |

---

## ML Models

| Model | Algorithm | Target |
|-------|-----------|--------|
| CGPA Predictor | XGBoost Regressor | Predicted CGPA |
| Risk Classifier | LightGBM Classifier | Academic risk probability |
| Placement Predictor | XGBoost Classifier | Placement probability |

**Features used:** avg_attendance, avg_internal_marks, avg_external_marks, current_cgpa, total_backlogs, subjects_failed, attendance_trend, marks_trend, internship_count, certifications_count, coding_score, extra_curricular_score

**Explainability:** SHAP values returned with every prediction for transparency.

---

## Role-Based Access Control

| Feature | Admin | Principal | Faculty | Student |
|---------|-------|-----------|---------|---------|
| Institution KPIs | ✅ | ✅ | ❌ | ❌ |
| Department Analytics | ✅ | ✅ | ✅ | ❌ |
| Student Management | ✅ | ❌ | ❌ | ❌ |
| Upload Attendance/Marks | ✅ | ❌ | ✅ | ❌ |
| View Own Data | ✅ | ✅ | ✅ | ✅ |
| AI Predictions | ✅ | ✅ | ✅ | Own only |
| AI Chatbot | ✅ | ✅ | ✅ | ✅ |
| Import Dataset | ✅ | ❌ | ❌ | ❌ |
| Train Models | ✅ | ❌ | ❌ | ❌ |

---

## ETL Pipeline

1. **Extract** — Read Excel file with pandas
2. **Transform** — Clean nulls, remove duplicates, validate ranges, create derived features (risk_score, attendance_trend, marks_trend)
3. **Load** — Insert into MySQL: departments → students → placements → ml_features

Run manually:
```bash
python etl/pipeline.py storage/uploads/CampusIQ_20000_Students_Dataset.xlsx
```

---

## Testing

```bash
cd tests
pytest -v
```

---

## Environment Variables

See `backend/.env.example` for all configuration options.

Key variables:
- `DATABASE_URL` — MySQL connection string
- `SECRET_KEY` — JWT signing key (change in production!)
- `OPENAI_API_KEY` — Optional, for LLM-enhanced chatbot
- `DATASET_PATH` — Path to Excel dataset

---

## Production Checklist

- [ ] Change `SECRET_KEY` in `.env`
- [ ] Set strong database passwords
- [ ] Configure `ALLOWED_ORIGINS` for your domain
- [ ] Enable HTTPS via reverse proxy
- [ ] Set `DEBUG=false`
- [ ] Configure log rotation
- [ ] Set up database backups
- [ ] Add `OPENAI_API_KEY` for enhanced AI chatbot
