# Threat Model (High Level)

- License tampering: mitigated by Ed25519 signing + canonical JSON.
- Offline use: EM&V verifies signatures locally; online revocation is enforced at sync time.
- Cross-program privilege: prevented by program guardrails and template validation.
- Baseline manipulation: prevented by final seal signed by license-service; tracking trusts only final seal.
