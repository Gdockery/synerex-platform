# Synerex Platform – Licensing Architecture

## Overview
This monorepo contains:
- **license-service**: cryptographic signing, online verification, revocation, baseline seal registry, audit logs.
- **emv-program**: Synerex EM&V program engine that creates EM&V authorizations.
- **tracking-program**: Synerex Tracking program engine that creates Tracking authorizations.
- **clients**: EM&V offline client SDK and Tracking portal integration middleware.

## Key Principles
- **One enforcement service**, **two program authorities** (EM&V and Tracking).
- EM&V can work **offline** with signed licenses, then **sync** seals later.
- Tracking is **online-only** and verifies licenses against license-service.
