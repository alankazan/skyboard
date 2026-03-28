FROM python:3.12-slim

WORKDIR /app

# Dependências sistema (lm-sensors para temp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    lm-sensors \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código
COPY server.py .
COPY static/ ./static/

# Dados persistentes (wallpapers, config)
RUN mkdir -p /app/data/wallpapers

EXPOSE 8585

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8585"]
