# Turniq — Tournament Management App

React (Vite) + Django REST Framework + PostgreSQL

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL running locally

### 1. Database
```sql
createdb turniq
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # edit DB credentials if needed
./start.sh                  # creates venv, installs deps, migrates, runs on :8000
```

Or manually:
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # runs on :5173
```

Open http://localhost:5173

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/register/ | No | Register user |
| POST | /api/auth/token/ | No | JWT login |
| GET | /api/tournaments/ | No | List tournaments |
| POST | /api/tournaments/ | Yes | Create tournament |
| GET | /api/tournaments/:id/ | No | Tournament detail |
| POST | /api/tournaments/:id/teams/ | Organizer | Add team |
| POST | /api/tournaments/:id/generate-schedule/ | Organizer | Generate round-robin |
| GET | /api/tournaments/:id/schedule/ | No | Match list |
| GET | /api/tournaments/:id/standings/ | No | Standings table |
| POST | /api/matches/:id/result/ | Organizer | Enter score |

## Flow
1. Register / login
2. Create tournament (name + sport)
3. Add teams (2+)
4. Click "Generate Schedule" — round-robin matches auto-created
5. Enter results match by match → standings auto-recalculate
6. Share tournament URL — anyone can view without auth
