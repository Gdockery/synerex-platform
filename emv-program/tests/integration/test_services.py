"""
Integration tests for service health endpoints
"""
import pytest
import requests
import time


@pytest.mark.integration
class TestServiceHealth:
    """Tests for service health endpoints"""
    
    @pytest.fixture(autouse=True)
    def wait_for_services(self):
        """Wait a bit for services to be ready"""
        time.sleep(1)
    
    def test_main_app_health(self):
        """Test main app health endpoint"""
        try:
            response = requests.get("http://127.0.0.1:8082/api/health", timeout=2)
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
        except requests.exceptions.ConnectionError:
            pytest.skip("Main app service not running")
    
    def test_pdf_service_health(self):
        """Test PDF service health endpoint"""
        try:
            response = requests.get("http://127.0.0.1:8083/health", timeout=2)
            assert response.status_code == 200
        except requests.exceptions.ConnectionError:
            pytest.skip("PDF service not running")
    
    def test_html_service_health(self):
        """Test HTML report service health endpoint"""
        try:
            response = requests.get("http://127.0.0.1:8084/health", timeout=2)
            assert response.status_code == 200
        except requests.exceptions.ConnectionError:
            pytest.skip("HTML service not running")
    
    def test_chart_service_health(self):
        """Test chart service health endpoint"""
        try:
            response = requests.get("http://127.0.0.1:8086/health", timeout=2)
            assert response.status_code == 200
        except requests.exceptions.ConnectionError:
            pytest.skip("Chart service not running")
    
    def test_weather_service_health(self):
        """Test weather service health endpoint"""
        try:
            response = requests.get("http://127.0.0.1:8200/health", timeout=2)
            assert response.status_code == 200
        except requests.exceptions.ConnectionError:
            pytest.skip("Weather service not running")

