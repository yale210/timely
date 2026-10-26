FROM ghcr.io/astral-sh/uv:python3.12-alpine

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .

RUN apk add --no-cache postgresql-libs

RUN uv pip install --no-cache-dir --system -r requirements.txt

COPY . .

RUN SECRET_KEY=build-only-not-used-at-runtime \
    ALLOWED_HOSTS=localhost \
    DEBUG=False \
    python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["uvicorn", "source.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]
