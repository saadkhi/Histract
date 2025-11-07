# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Collect static + migrate
CMD ["sh", "-c", "python manage.py migrate && python manage.py load_knowledge && gunicorn chatbot_backend.wsgi:application --bind 0.0.0.0:8000"]