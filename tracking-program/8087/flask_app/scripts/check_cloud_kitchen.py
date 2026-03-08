#!/usr/bin/env python3
"""
Check if Cloud Kitchen exists in the tracking database.
Usage: cd flask_app && python -c "from scripts.check_cloud_kitchen import main; main()"
Or: flask run --with-threads &  # then run: python scripts/check_cloud_kitchen.py
"""
from app import create_app
from app.db.request_session import get_session
from app.models.client import Client


def main():
    app = create_app()
    with app.app_context():
        sess = get_session()
        clients = sess.query(Client).filter(Client.name.ilike("%Cloud Kitchen%")).all()
        print("=" * 60)
        print("CLOUD KITCHEN CHECK")
        print("=" * 60)
        if not clients:
            print("No clients with 'Cloud Kitchen' in name found.")
            all_count = sess.query(Client).filter_by(isDeleted=False).count()
            print(f"Total active clients in DB: {all_count}")
        else:
            for c in clients:
                print(f"  id={c.id}  name={c.name!r}  isDeleted={c.isDeleted}  createdBy={getattr(c, 'createdBy', None)}  org_id={getattr(c, 'org_id', None)}")
            print()
            deleted = [c for c in clients if c.isDeleted]
            if deleted:
                print("To restore soft-deleted client(s), run:")
                for c in deleted:
                    print(f"  UPDATE client SET isDeleted=0 WHERE id={c.id};")


if __name__ == "__main__":
    main()
