import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f"postgresql://{os.environ.get('DB_USER', 'dbuser')}:{os.environ.get('DB_PASSWORD', 'dbpassword')}@" \
        f"{os.environ.get('DB_HOST', 'localhost')}:{os.environ.get('DB_PORT', '5432')}/" \
        f"{os.environ.get('DB_NAME', 'hhboffers')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
