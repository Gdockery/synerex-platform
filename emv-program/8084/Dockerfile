FROM python:3.11-slim
WORKDIR /app/8084
RUN pip install --no-cache-dir flask flask-cors requests
COPY . /app/8084
EXPOSE 8084
CMD ["python", "html_report_service.py"]
