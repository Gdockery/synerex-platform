FROM python:3.11-slim
WORKDIR /app
COPY services/license-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY services/license-service /app/services/license-service
COPY templates /app/templates
WORKDIR /app/services/license-service
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
