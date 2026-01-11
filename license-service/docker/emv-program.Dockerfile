FROM python:3.11-slim
WORKDIR /app
COPY services/emv-program /app/services/emv-program
CMD ["python", "-c", "print('emv-program scaffold')"]
