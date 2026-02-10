# TLS Certificates

Place your TLS files here:

- `fullchain.pem`
- `privkey.pem`

For local testing, you can generate a self-signed cert:

```bash
./scripts/gen_self_signed_certs.sh
```
Self-signed certs (optional)

This folder is mounted into the Nginx proxy container at `/etc/nginx/certs`.

Expected files:
- fullchain.pem
- privkey.pem

To generate a quick local self-signed cert:

1) From repo root:
   ./scripts/generate_self_signed_cert.sh

2) Then restart compose.
