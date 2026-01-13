.PHONY: help install install-dev test test-cov lint format clean start stop check security-check deps-check

help: ## Show this help message
	@echo "SYNEREX OneForm - Development Commands"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install production dependencies
	pip install -r 8082/requirements.txt
	pip install -r 8083/requirements.txt
	pip install -r 8085/requirements.txt
	pip install -r requirements_service_manager.txt
	@if [ -f "8082/requirements_ollama.txt" ]; then pip install -r 8082/requirements_ollama.txt; fi

install-dev: ## Install development dependencies
	pip install -e ".[dev]"
	@echo "Development dependencies installed"

test: ## Run tests
	pytest

test-cov: ## Run tests with coverage report
	pytest --cov --cov-report=html --cov-report=term-missing
	@echo "Coverage report generated in htmlcov/index.html"

lint: ## Run all linters
	@echo "Running pylint..."
	pylint 8082/*.py 8083/*.py 8084/*.py 8085/*.py 8086/*.py || true
	@echo "Running mypy..."
	mypy 8082 8083 8084 8085 8086 || true
	@echo "Running pyflakes..."
	pyflakes 8082 8083 8084 8085 8086 || true
	@echo "Running vulture..."
	vulture . --min-confidence 80 || true

format: ## Format code with black and isort
	black .
	isort .

format-check: ## Check code formatting without making changes
	black --check .
	isort --check .

clean: ## Clean temporary files and caches
	find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name ".pytest_cache" -exec rm -r {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -r {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -r {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete
	rm -rf dist/ build/ *.egg-info/ 2>/dev/null || true
	@echo "Cleanup complete"

start: ## Start all services
	./start_services.sh

stop: ## Stop all services
	./stop_services.sh

check: ## Run all checks (lint, test, security)
	@echo "=== Running all checks ==="
	@echo "1. Format check..."
	@$(MAKE) format-check || true
	@echo "2. Linting..."
	@$(MAKE) lint || true
	@echo "3. Security check..."
	@$(MAKE) security-check || true
	@echo "4. Dependency check..."
	@$(MAKE) deps-check || true
	@echo "5. Running tests..."
	@$(MAKE) test || true
	@echo "=== All checks complete ==="

security-check: ## Run security scanning tools
	@echo "Running bandit (security linting)..."
	bandit -r 8082 8083 8084 8085 8086 || true
	@echo "Running safety (dependency vulnerability check)..."
	safety check || true

deps-check: ## Check for dependency vulnerabilities
	safety check

dead-code: ## Find dead code with vulture
	vulture . --min-confidence 80

unused-imports: ## Find and remove unused imports
	autoflake --check --recursive . || true
	@echo "Run 'autoflake --in-place --remove-all-unused-imports --recursive .' to fix"

