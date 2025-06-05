# Migrations

This directory stores database migration scripts managed by Flask-Migrate.

## Common Commands

Make sure your `.env` file is correctly configured with database credentials.
Ensure you have `FLASK_APP=run.py` set in your environment or preface commands with it.

- **Initialize (run once per project):**
  ```bash
  flask db init
  ```
  *This command should have already been effectively prepared by creating this directory.*
  *If you ever need to re-initialize, delete this directory's contents first (except this README).*

- **Generate a new migration:**
  (After changing your SQLAlchemy models in `app/models/`)
  ```bash
  flask db migrate -m "Descriptive message for your migration"
  ```

- **Apply migrations to the database:**
  ```bash
  flask db upgrade
  ```

- **Downgrade migrations (roll back):**
  ```bash
  flask db downgrade
  ```

- **View migration history:**
  ```bash
  flask db history
  ```

- **Show current revision:**
  ```bash
  flask db current
  ```
