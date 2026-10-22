# Adaptis

AI agent builder: a client uploads their company knowledge, trains an agent, and embeds it on their website (plus Telegram / Instagram / Facebook).

- `agent_backend/` — Django REST API, Celery, widget script (`static/widget/agent.js`)
- `agent_admin/` — client portal (Vite + React + TypeScript)

## Run locally

**Backend** (terminal 1)

```bash
cd agent_backend
python -m pip install -r requirements.txt
cp .env.example .env
# dev defaults: SQLite + inline Celery
sed -i '' 's#^DATABASE_URL=.*#DATABASE_URL=sqlite:///db.sqlite3#' .env
echo "CELERY_TASK_ALWAYS_EAGER=1" >> .env
python manage.py migrate
python manage.py runserver
```

**Frontend** (terminal 2)

```bash
cd agent_admin
npm install
npm run dev
```

Open http://localhost:3000 — register a company, create an agent, add knowledge, train.

## Widget demo

After training, copy the public key from *Look & install* and open:

```
http://127.0.0.1:8000/static/widget/demo.html?key=ag_…
```

## RAG service

`agent_backend/apps/knowledge/rag_client.py` is the only file that talks to the RAG engine. Set `RAG_SERVICE_URL`, `RAG_SERVICE_TOKEN` and `RAG_CALLBACK_SECRET` in `.env`. Contract: `POST /index` (async, calls back `/internal/rag-callback/`) and `POST /answer` (JSON or SSE).

## Production notes

- Use Postgres + Redis (`docker compose up -d db redis`) and a real Celery worker: `celery -A config worker -l info`
- `PUBLIC_BASE_URL` must be a public HTTPS address — Telegram and Meta webhooks won't accept localhost
- `META_VERIFY_TOKEN` must match the token entered in the Meta app's webhook settings
