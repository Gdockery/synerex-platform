# Database Notes — Synerex Platform

## Overview

There are **three separate MySQL containers** and **three independent user systems**. A person needing access to all three programs needs a user account in each.

| Program | Container | Database | Credentials |
|---|---|---|---|
| License Service | `synerex-platform-mysql-1` | `licensing` | `license_user` / `LicensePass123` |
| Tracking Program | `synerex-platform-mysql-tracking-1` | `tracking` | `tracking_user` / `TrackingPass123` |
| EMV Program | `synerex-platform-mysql-emv-1` | `emv` | `emv_user` / `EmvPass123` |

Root password for all three MySQL containers: `rootpass123`

---

## Accessing the Databases

SSH into the server first:
```bash
ssh -i ~/.ssh/synerex root@synerexlabs.com
```

### License DB
```bash
/snap/bin/docker exec synerex-platform-mysql-1 \
  mysql -u license_user -pLicensePass123 licensing
```

### Tracking DB
```bash
/snap/bin/docker exec synerex-platform-mysql-tracking-1 \
  mysql -u tracking_user -pTrackingPass123 tracking
```

### EMV DB
```bash
/snap/bin/docker exec synerex-platform-mysql-emv-1 \
  mysql -u emv_user -pEmvPass123 emv
```

---

## Do I need 3 separate users?

**It depends on which programs the person needs:**

- **Tracking only (most common)** — one user in the `tracking` DB only. This covers the main dashboard, meters, CSV, alerts, etc.
- **License admin panel** (`synerexlabs.com/license`) — managed separately through the license service. OEM users generally don't need this.
- **EMV** (`/emv/`) — a completely separate tool for M&V energy analysis. Has its own login with roles: `administrator`, `engineer`, `pe_reviewer`. Only relevant if the person is doing load analysis work.

**For OEM users (Oscar, new Harmoniq user, Xeco user):** only the **Tracking DB** user is needed.

---

## Tracking DB: Roles

| Role # | Description |
|---|---|
| `8` | Synerex Admin — sees everything across all OEMs |
| `9` | OEM Admin — manages users/clients for their OEM org |
| `10` | OEM User — read-only access to their OEM's clients/projects |
| `7` | Account Manager |
| `2` | Client Admin |
| `1` | Standard user |

OEM access is scoped by `org_id` on the user. The user sees only clients where `client.sponsor_org_id = user.org_id`.

---

## Tracking DB: Creating a New User

Generate a bcrypt password hash and insert the user. Run this on the server:

```bash
/snap/bin/docker exec synerex-platform-tracking-program-1 python3 -c "
import bcrypt, time
email     = 'newuser@example.com'
password  = 'ChangeMe123!'
firstName = 'First'
lastName  = 'Last'
role      = 9                   # 9 = OEM Admin, 10 = OEM User
org_id    = 'OEM-HARMONIQ'      # from the license service org list
now       = int(time.time() * 1000)
h = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)).decode()
print(f'INSERT INTO user (firstName, lastName, email, hashedPassword, role, org_id, isDeleted, createdAt, updatedAt)')
print(f'VALUES (\"{firstName}\", \"{lastName}\", \"{email}\", \"{h}\", {role}, \"{org_id}\", 0, {now}, {now});')
"
```

Copy the printed SQL, then run it:

```bash
/snap/bin/docker exec synerex-platform-mysql-tracking-1 \
  mysql -u tracking_user -pTrackingPass123 tracking \
  -e 'INSERT INTO user ...'   # paste the output here
```

Or do it all in one step (replace values as needed):

```bash
/snap/bin/docker exec synerex-platform-tracking-program-1 python3 << 'EOF'
import bcrypt, time
from run import app
with app.app_context():
    from app.extensions import db
    from app.models.user import User
    now = int(time.time() * 1000)
    h = bcrypt.hashpw(b'ChangeMe123!', bcrypt.gensalt(rounds=10)).decode()
    u = User(
        firstName='First',
        lastName='Last',
        email='newuser@example.com',
        hashedPassword=h,
        role=9,
        org_id='OEM-HARMONIQ',
        isDeleted=False,
        createdAt=now,
        updatedAt=now,
    )
    db.session.add(u)
    db.session.commit()
    print(f'Created user id={u.id} email={u.email} role={u.role} org_id={u.org_id}')
EOF
```

---

## Known OEM org_ids

Pulled from the License Service (`/api/orgs`):

| org_id | Name | Type |
|---|---|---|
| `OEM-HARMONIQ` | Harmoniq | OEM |
| `OEM-XECO-ENERGY` | Xeco Energy | OEM |
| `XCT` | XCT | OEM |
| `CUSTOMER-XECO-ENERGY-CORPORAT-002` | XECO ENERGY CORPORATION | Customer |
| `CUSTOMER-ROCKWOOL-WEST-VA` | Rockwool-West-VA | Customer |
| `ADMIN` | Admin Organization | — |

To refresh this list from the server:
```bash
curl -s http://localhost:8000/api/orgs | python3 -m json.tool | grep -E 'org_id|org_name|org_type'
```

---

## Client → OEM Assignments

`client.sponsor_org_id` controls which OEM can see which client.

```sql
-- See current assignments
SELECT id, name, sponsor_org_id FROM client ORDER BY id;

-- Assign a client to an OEM
UPDATE client SET sponsor_org_id='OEM-HARMONIQ' WHERE id=<client_id>;
```

Current assignments:
| Client | sponsor_org_id |
|---|---|
| Cloud Kitchen (1386) | `OEM-HARMONIQ` |
| Savoy Hotels (1387) | `OEM-HARMONIQ` |
| Rockwool (5) | `OEM-HARMONIQ` |
| Ochsner Health System (4) | `OEM-XECO-ENERGY` |

---

## EMV DB: Creating a User

EMV uses SHA-256 (not bcrypt) and has its own role names.

```bash
/snap/bin/docker exec synerex-platform-mysql-emv-1 mysql -u emv_user -pEmvPass123 emv -e "
INSERT INTO users (full_name, email, username, password_hash, role)
VALUES (
  'Full Name',
  'user@example.com',
  'username',
  SHA2('password123', 256),
  'engineer'   -- roles: administrator, engineer, pe_reviewer
);
"
```

---

## License Service: Viewing/Managing Orgs and Users

The license service has a web admin panel at:
```
https://synerexlabs.com/license/auth/login
```
Login: `admin@synerex.local` / `admin123`

From there you can create OEM organizations, manage subscriptions, and view registered users. This is the source of truth for `org_id` values used by the tracking system.

The license service API is also queryable directly from the server:
```bash
# List all orgs
curl -s http://localhost:8000/api/orgs | python3 -m json.tool

# List users in an org
curl -s http://localhost:8000/api/orgs/OEM-HARMONIQ/users | python3 -m json.tool
```
