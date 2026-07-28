# Partneron v1

`frontend`는 Next.js UI, `backend`는 Django REST API로 완전히 분리되어 있습니다.

## Run

```bash
# frontend
cd frontend && npm install && npm run dev

# backend
cd backend && python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `frontend/.env.local` when running locally.
