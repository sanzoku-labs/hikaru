# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Backend + serve frontend
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install poetry==1.7.1 && poetry config virtualenvs.create false

COPY backend/pyproject.toml backend/poetry.lock ./
RUN poetry install --no-dev --no-interaction --no-ansi

COPY backend/ .
COPY --from=frontend /frontend/dist ./frontend_dist

RUN mkdir -p uploads storage/reports

EXPOSE 8000

COPY <<'EOF' /app/start.sh
#!/bin/sh
echo "Waiting for database..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  alembic upgrade head && break
  echo "Attempt $i failed, retrying in 3s..."
  sleep 3
done
echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
EOF
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
