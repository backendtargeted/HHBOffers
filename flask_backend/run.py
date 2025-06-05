from app import create_app, db
# Import models to ensure they are registered with SQLAlchemy for migrations
from app.models import Property, OfferHistory, UploadJob, ActivityLog

app = create_app()

# Flask-Migrate commands
@app.shell_context_processor
def make_shell_context():
    return {'db': db}

# Example of how to add custom CLI commands, if needed later
# @app.cli.command("create-db")
# def create_db_command():
#     """Creates the database tables."""
#     db.create_all()
#     print("Database tables created.")


if __name__ == '__main__':
    app.run(debug=True)
