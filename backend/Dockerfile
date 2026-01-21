FROM ghcr.io/astral-sh/uv:python3.12-alpine

WORKDIR /app

COPY requirements.txt .

RUN uv pip install --no-cache-dir --system 'gunicorn==23.0.0'

RUN uv pip install --no-cache-dir --system 'whitenoise==6.6.0'

RUN uv pip install --no-cache-dir --system -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "source.wsgi:application"]
