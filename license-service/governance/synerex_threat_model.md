
# Synerex Platform – Formal Threat Model

## 1. Scope
This document defines the threat model for the Synerex One EM&V Program,
Synerex Tracking Program, and the Synerex License Service.

## 2. Assets Protected
- Signed licenses (EM&V and Tracking)
- Baseline seals and immutable snapshots
- Audit logs
- Patent-protected methodologies (US‑12,375,324‑B2)
- Utility submissions and evidence packages

## 3. Trust Boundaries
- Offline EM&V client ↔ License Service
- Tracking Portal ↔ License Service
- OEM / Integrator ↔ End Customer
- Synerex ↔ Utility / Regulator (read‑only)

## 4. Threat Actors
- Unauthorized OEM integrators
- End users attempting license reuse
- Competitors attempting reverse engineering
- Insider misuse
- Data tampering during disputes

## 5. Threat Categories & Mitigations
### License Forgery
Mitigation: Ed25519 signatures, online verification, revocation checks.

### Baseline Tampering
Mitigation: Immutable snapshots, hash manifests, audit trails.

### Unauthorized Tracking
Mitigation: Mandatory EM&V → Tracking lineage enforcement.

### License Leakage
Mitigation: Watermarking, device binding, audit anomaly detection.

### Patent Circumvention
Mitigation: Explicit patent attribution, intent clauses, evidentiary export.

## 6. Residual Risk
Residual risk is limited to infrastructure compromise scenarios and is
addressed through standard cloud security controls.

## 7. Conclusion
The Synerex architecture materially reduces technical, legal, and commercial
risk compared to conventional licensing systems.
