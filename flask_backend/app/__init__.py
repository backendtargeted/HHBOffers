from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config
import redis
from app.routes.property_routes import bp as property_routes_bp
from app.routes.offer_history_routes import bp as offer_history_routes_bp
from app.routes.upload_routes import bp as upload_routes_bp
from app.routes.stats_routes import bp as stats_routes_bp

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)

    # Initialize Redis connection
    # Note: Configuration for Redis will be handled in Config
    app.redis = redis.StrictRedis.from_url(app.config['REDIS_URL']) if app.config.get('REDIS_URL') else None

    # Register Blueprints here (to be added later)
    app.register_blueprint(property_routes_bp, url_prefix='/api/properties')
    app.register_blueprint(offer_history_routes_bp, url_prefix='/api/offers')
    app.register_blueprint(upload_routes_bp, url_prefix='/api/upload')
    app.register_blueprint(stats_routes_bp, url_prefix='/api/stats')

    @app.route('/health')
    def health_check():
        return {'status': 'UP'}

    return app
