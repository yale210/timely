FROM ghcr.io/astral-sh/uv:python3.12-alpine

COPY requirements.txt .

RUN uv pip install --no-cache-dir --system 'gunicorn==23.0.0'

RUN uv pip install --no-cache-dir --system -r requirements.txt

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "source.wsgi:application"]