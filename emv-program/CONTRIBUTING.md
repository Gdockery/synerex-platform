# Contributing to SYNEREX OneForm

Thank you for your interest in contributing to SYNEREX OneForm! This document provides guidelines and instructions for contributors.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd synerex-oneform
   ```

2. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   make install          # Production dependencies
   make install-dev     # Development dependencies
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Code Style

- Follow PEP 8 style guidelines
- Use `black` for code formatting: `make format`
- Use `isort` for import sorting (configured to work with black)
- Maximum line length: 100 characters
- Run `make format-check` before committing

## Testing

- Write tests for new features and bug fixes
- Run tests: `make test`
- Run tests with coverage: `make test-cov`
- Target: 60%+ code coverage for critical paths
- Place tests in `tests/` directory following the structure:
  - `tests/unit/` - Unit tests
  - `tests/integration/` - Integration tests

## Code Quality Checks

Before submitting a pull request, run:
```bash
make check
```

This runs:
- Format checking
- Linting (pylint, mypy, pyflakes)
- Security scanning (bandit, safety)
- Tests

## Pull Request Process

1. Create a feature branch from `main` or `ready-for-server`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

3. Push to your fork and create a pull request

4. Ensure all checks pass:
   - Code formatting
   - Linting
   - Security scans
   - Tests

## Commit Messages

Use clear, descriptive commit messages:
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Be specific about what changed
- Reference issue numbers if applicable

Examples:
- `Fix: Update README to reference correct production file`
- `Add: Unit tests for analysis_helpers module`
- `Update: .gitignore to exclude generated files`

## File Organization

- Production code: `8082/`, `8083/`, `8084/`, `8085/`, `8086/`
- Tests: `tests/`
- Documentation: `docs/` or root-level `.md` files
- Scripts: `scripts/` (utility scripts)

## Questions?

If you have questions, please open an issue or contact the maintainers.

