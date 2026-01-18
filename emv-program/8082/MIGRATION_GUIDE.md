# Migration Guide: Moving to Multi-Tenant Database

## Quick Start

For your admin account, we'll use **`admin`** as your `org_id`. This is simple and works immediately.

## Step 1: Run the Migration Script

```bash
cd emv-program/8082
python migrate_to_multi_tenant.py admin
```

This will:
- ✅ Create a backup of your current database
- ✅ Copy all your projects and data to `results/org_admin/app.db`
- ✅ Verify the migration was successful

## Step 2: Update Your Login

When logging in to the EMV program, you'll need to provide `org_id: "admin"` in your login request.

### For Username/Password Login:
```json
{
  "username": "your_username",
  "password": "your_password",
  "role": "administrator",
  "org_id": "admin"
}
```

### For License Service Token Login:
The License Service token should already include `org_id`, but if not, you can use `admin` as your org_id.

## Step 3: Verify Your Projects

After migration:
1. Log in with `org_id: "admin"`
2. Check that all your projects are visible
3. Verify file uploads work
4. Test an analysis to ensure everything works

## What Happens to Your Data

- **Old location**: `results/app.db` (kept as backup)
- **New location**: `results/org_admin/app.db` (your isolated database)
- **Backup**: `results/backups/app.db.backup_YYYYMMDD_HHMMSS`

## Creating a Proper Organization (Optional)

If you want to create a proper organization in the License Service:

1. Go to `http://localhost:8000/register`
2. Register as a "customer" organization
3. Note your `org_id` (it will be shown after registration)
4. Run the migration script with that `org_id` instead of "admin"

## Troubleshooting

### "Organization ID required" error
- Make sure you're providing `org_id: "admin"` in your login request
- Check that the migration completed successfully

### Projects not showing
- Verify the migration script completed without errors
- Check that `results/org_admin/app.db` exists
- Ensure you're logging in with `org_id: "admin"`

### Need to re-run migration
- The migration script uses `INSERT OR REPLACE`, so it's safe to run multiple times
- Your backup is in `results/backups/`

## Next Steps After Migration

Once everything is verified:
1. ✅ Your data is now isolated in `results/org_admin/app.db`
2. ✅ Other companies won't be able to see your projects
3. ✅ You can archive the old database: `mv results/app.db results/app.db.old`
4. ✅ Keep the backup until you're 100% sure everything works
