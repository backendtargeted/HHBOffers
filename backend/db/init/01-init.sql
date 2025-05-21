-- db/init/01-init.sql

-- Grant privileges
ALTER USER dbuser WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE hhboffers TO dbuser;

-- Connect to the database (this will be used by subsequent commands)
\connect hhboffers;

-- Set the search path to public
SET search_path TO public;

-- Create tables

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  property_address VARCHAR(255) NOT NULL,
  property_city VARCHAR(100) NOT NULL,
  property_state VARCHAR(2) NOT NULL,
  property_zip VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for property table
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_unique ON properties(
  property_address, 
  property_city, 
  property_state, 
  property_zip
);

CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(property_address);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(property_city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(property_state);
CREATE INDEX IF NOT EXISTS idx_properties_last_name ON properties(last_name);

-- Offer History Table
CREATE TABLE IF NOT EXISTS offer_histories (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  offer_amount DECIMAL(12, 2) NOT NULL,
  offer_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for offer_histories table
CREATE INDEX IF NOT EXISTS idx_offer_history_property ON offer_histories(property_id);
CREATE INDEX IF NOT EXISTS idx_offer_history_date ON offer_histories(offer_date);

-- Upload Jobs Table
CREATE TABLE IF NOT EXISTS upload_jobs (
  id VARCHAR(100) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  new_records INTEGER DEFAULT 0,
  error_records INTEGER NOT NULL DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  error_details TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_upload_jobs_status ON upload_jobs(status);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON audit_logs(created_at);

-- Drop any existing user-related tables and indexes if they exist
DROP TABLE IF EXISTS users CASCADE;
DROP INDEX IF EXISTS idx_activity_logs_user_id;

-- Create dbuser role
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dbuser') THEN
        CREATE ROLE dbuser WITH LOGIN PASSWORD 'dbpassword';
        ALTER ROLE dbuser WITH SUPERUSER;
    END IF;
END$$;

-- Grant all privileges to dbuser on all tables in the public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dbuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dbuser;

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables
CREATE TRIGGER update_properties_timestamp 
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER update_upload_jobs_timestamp 
BEFORE UPDATE ON upload_jobs
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER update_offer_histories_timestamp 
BEFORE UPDATE ON offer_histories
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
