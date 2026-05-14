#!/bin/sh
set -e

echo "[entrypoint] Waiting for PostgreSQL..."
until python -c "
import psycopg2, os
psycopg2.connect(
    dbname=os.environ.get('DB_NAME','dao_db'),
    user=os.environ.get('DB_USER','dao_user'),
    password=os.environ.get('DB_PASSWORD','dao_password'),
    host=os.environ.get('DB_HOST','db'),
    port=os.environ.get('DB_PORT','5432')
)" 2>/dev/null; do
  echo "[entrypoint] PostgreSQL not ready — waiting 1s..."
  sleep 1
done
echo "[entrypoint] PostgreSQL ready."

echo "[entrypoint] Creating migrations..."
python manage.py makemigrations --noinput

echo "[entrypoint] Running migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

echo "[entrypoint] Seeding demo data..."
python manage.py seed_data || echo "[entrypoint] Seed already done or skipped."

echo "[entrypoint] Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
