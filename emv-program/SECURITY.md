# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 3.8.x   | :white_check_mark: |
| < 3.8   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it privately:

1. Email the security team directly
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices

### For Developers

- Never commit secrets, API keys, or passwords
- Use environment variables for sensitive configuration
- Review dependencies regularly: `make deps-check`
- Run security scans: `make security-check`
- Keep dependencies up to date
- Follow secure coding practices

### For Deployment

- Use strong, unique passwords
- Enable HTTPS/TLS
- Keep the system and dependencies updated
- Use environment variables for all secrets
- Restrict file upload types and sizes
- Implement rate limiting
- Use proper authentication and authorization
- Regular security audits

## Known Security Considerations

- File uploads are validated for type and size
- SQL injection prevention: Use parameterized queries
- XSS prevention: Input sanitization in templates
- CORS: Configured appropriately for production
- Secrets: Never hardcoded, use environment variables

## Security Tools

We use the following tools for security:
- `bandit` - Static security analysis
- `safety` - Dependency vulnerability scanning

Run security checks:
```bash
make security-check
```

