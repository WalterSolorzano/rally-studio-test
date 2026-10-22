# Isla de IA de Rally Studio.
# Un solo backend para todas las páginas estáticas publicadas.
# Los secretos (RALLY_AI_URL, RALLY_AI_KEY) se configuran en el host, nunca en el repo.

FROM python:3.11-slim

WORKDIR /app

# Solo dependencias del motor de IA. Si el host ya trae lo suyo, quita esta capa.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY scripts/rally_service.py ./
COPY docs ./docs

ENV RALLY_SERVICE_PORT=8080
EXPOSE 8080

CMD ["python", "rally_service.py"]
