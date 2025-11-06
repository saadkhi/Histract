# QeuryKhi — Chatbot / Knowledge Extraction

This repository contains a Django-based backend for a chatbot/knowledge extraction system and scaffolding for a frontend. The project uses FAISS for vector search, sentence-transformers for embeddings, and Celery + Redis for background tasks. A Docker Compose file is included that provides Postgres and Redis services.

This README documents how the system is organized, how to configure and run the backend and frontend, and all relevant Docker and docker-compose commands.

## Repository layout (important paths)

- `chatbot_project/` — main project folder
	- `backend/` — Django backend
		- `manage.py` — Django manage command
		- `requirements.txt` — Python dependencies
		- `chatbot_backend/` — Django project settings
			- `settings.py` — important configuration (default uses SQLite; environment variables read via python-dotenv)
		- `core/management/commands/load_knowledge.py` — management command to populate FAISS
		- `vector_store/` — current FAISS index and metadata
	- `frontend/` — frontend app (currently minimal / not implemented in this repo)
	- `docker-compose.yml` — provides `db: postgres:15` and `redis:7` services

## Quick analysis and assumptions

- The included `docker-compose.yml` defines `db` (Postgres) and `redis` services and a persistent volume for Postgres but does not currently define services for the Django backend or a frontend app. The Django `settings.py` in this repository defaults to SQLite and loads environment variables via `python-dotenv`.
- `backend/requirements.txt` lists packages such as `Django`, `djangorestframework`, `sentence-transformers`, `faiss-cpu` (or `faiss-gpu`), `celery[redis]`, `redis`, `python-dotenv`, and `groq`.
- The management command `load_knowledge` expects a dataset file and writes into the FAISS vector store. Its code currently references an absolute path which you may want to update to a relative path or accept a command argument.

If you want to run the system with Postgres and Redis provided by `docker-compose.yml`, you will need to update `settings.py` (or provide environment variables) to use Postgres instead of the default SQLite.

## Prerequisites

- Docker and Docker Compose (Compose v2 or v1 compatible with `docker compose` or `docker-compose`).
- Python 3.10+ for local development (backend).
- (Optional) GPU and `faiss-gpu` if you want GPU-accelerated FAISS.

## Environment variables

Create a `.env` file at `chatbot_project/backend/.env` (or export env vars) and set at minimum:

- `GROQ_API_KEY` — optional, used if you call the Groq API
- `DJANGO_SECRET_KEY` — optional override for `SECRET_KEY`
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` — if you switch to Postgres
- any other envs your deployment requires

Example `.env` (development):

```
GROQ_API_KEY=your_groq_key_here
DJANGO_SECRET_KEY=replace-this-secret
POSTGRES_DB=chatbot_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
```

Note: `settings.py` currently calls `load_dotenv()` so it will pick up `.env` when Django starts (if executed from the backend folder or with the proper CWD). You can also manage envs at the system level or through Docker Compose.

## Running the backend (local, without Docker)

1. Create a virtual environment and install dependencies:

```bash
cd chatbot_project/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Create `.env` as shown above (or set env vars).

3. Make migrations and run the server:

```bash
python manage.py migrate
python manage.py createsuperuser  # optional
python manage.py runserver 0.0.0.0:8000
```

4. Load knowledge into FAISS (if you have dataset.jsonl):

```bash
# from chatbot_project/backend
python manage.py load_knowledge
```

Note: The management command currently references an absolute path to the dataset; edit `core/management/commands/load_knowledge.py` to use a relative path or accept a CLI arg.

## Running with Docker / docker-compose

The repository provides `chatbot_project/docker-compose.yml` with `db` (Postgres) and `redis`. It does NOT currently define services for the Django backend or frontend. Below are recommended ways to use Docker for development and production.

Recommended: extend `docker-compose.yml` by adding services for `backend` and `frontend`. Example `docker-compose.dev.yml` snippet to add under `services` (example only):

```yaml
	backend:
		build:
			context: ./backend
			dockerfile: Dockerfile
		command: sh -c "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"
		volumes:
			- ./backend:/app
		ports:
			- "8000:8000"
		environment:
			- POSTGRES_DB=chatbot_db
			- POSTGRES_USER=postgres
			- POSTGRES_PASSWORD=password
			- GROQ_API_KEY=${GROQ_API_KEY}
		depends_on:
			- db
			- redis

	frontend:
		build:
			context: ./frontend
			dockerfile: Dockerfile
		ports:
			- "3000:3000"
		volumes:
			- ./frontend:/app
```

You can create a simple `Dockerfile` for the backend, for example:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
```

And a minimal frontend Dockerfile depends on your frontend stack (React/Vue/Next). For a React app:

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

Docker / docker-compose commands you will find useful

- Build images (when using service build in compose):

```bash
docker compose build
```

- Start services in attached mode (shows logs):

```bash
docker compose up
```

- Start services in detached mode:

```bash
docker compose up -d
```

- Stop and remove containers, networks (compose v2):

```bash
docker compose down
```

- Tail logs for a service (e.g., backend):

```bash
docker compose logs -f backend
```

- Execute a command in a running container (open shell):

```bash
docker compose exec backend sh
# or for the non-root environment
docker compose exec backend bash
```

- Remove unused images and volumes (clean up):

```bash
docker system prune -a
docker volume prune
```

If you only want to spin up db + redis (the file in repo currently provides them):

```bash
cd chatbot_project
docker compose up -d
# confirm Postgres is ready on 5432 and Redis on 6379
```

Then start the backend locally (pointing to that Postgres) by setting the DB envs and migrating.

## Switching Django to Postgres (example snippet)

Replace the `DATABASES` section in `chatbot_project/backend/chatbot_backend/settings.py` with something like:

```python
import os

DATABASES = {
		'default': {
				'ENGINE': 'django.db.backends.postgresql',
				'NAME': os.getenv('POSTGRES_DB', 'chatbot_db'),
				'USER': os.getenv('POSTGRES_USER', 'postgres'),
				'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'password'),
				'HOST': os.getenv('POSTGRES_HOST', 'db'),
				'PORT': os.getenv('POSTGRES_PORT', '5432'),
		}
}
```

When using docker-compose, `POSTGRES_HOST` can be `db` (the service name in compose).

## Celery (background tasks)

To run Celery workers against the Django app using Redis as broker:

```bash
# from chatbot_project/backend
celery -A chatbot_backend worker --loglevel=info
```

In Docker, add a `celery` service that depends on `backend` and `redis` and uses the same codebase.

## Important notes and next steps

- The frontend folder currently contains only a `.gitignore`. If you plan to add a UI, include a `Dockerfile` and add a `frontend` service to your compose file.
- The management command `load_knowledge` uses an absolute dataset path. Consider updating it to accept a CLI argument or relative path.
- If you plan to use GPU `faiss-gpu`, update `requirements.txt` and ensure the host has appropriate drivers.
- For production, set `DEBUG=False`, configure `ALLOWED_HOSTS`, secure SECRET_KEY`, and use a proper reverse proxy (nginx) and HTTPS.

## Troubleshooting

- If migrations fail with Postgres connection errors: ensure `docker compose up db` is running and that Django env variables point to the `db` host.
- If FAISS index cannot be found: verify `vector_store/index.faiss` path exists and the process has read permissions.

## Summary

This README summarizes how to configure both backend and frontend (notes and sample snippets), what Docker services are in `docker-compose.yml`, and lists the most useful Docker and `docker compose` commands for development. If you want, I can:

- Add a sample `docker-compose.override.yml` that includes backend and frontend services for development.
- Create minimal `Dockerfile`s for backend and a sample React frontend and wire them into compose.
- Fix `load_knowledge` to accept a dataset path argument.

Tell me which of these you'd like me to implement next.
