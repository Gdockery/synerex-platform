FROM python:3.11-slim
WORKDIR /app
COPY services/tracking-program /app/services/tracking-program
CMD ["python", "-c", "print('tracking-program scaffold')"]
