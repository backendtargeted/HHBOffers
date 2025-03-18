-- db/init/01-init.sql

-- Create tables

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  property_address VARCHAR(255) NOT NULL,
  property_city VARCHAR(100) NOT NULL,
  property_state VARCHAR(2) NOT NULL,
  property_zip VARCHAR(10) NOT NULL,
  offer DECIMAL(12, 2) NOT NULL,
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

-- Upload Jobs Table
CREATE TABLE IF NOT EXISTS upload_jobs (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  new_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  error_records INTEGER DEFAULT 0,
  error_details TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_upload_jobs_user_id ON upload_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_status ON upload_jobs(status);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON audit_logs(created_at);

-- Create Admin User
-- Password: Admin@123456 (bcrypt hash)
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES (
  'Admin User',
  'admin@example.com',
  '$2a$12$hZ1T7Ws0BWn9PR3rF90arO.oRGMsfMkOIDmZtVE7yXqipIkDZl6.a',
  'admin',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Create Manager User
-- Password: Manager@123456 (bcrypt hash)
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES (
  'Manager User',
  'manager@example.com',
  '$2a$12$AUGsMroR4aaqXZMt.zbi4.PsOKltaKWDbGG3Ld.c8jXaCJzOyYo72',
  'manager',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Create Regular User
-- Password: User@123456 (bcrypt hash)
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES (
  'Regular User',
  'user@example.com',
  '$2a$12$m6XIUzcTcfIr3CzZ31csBe6lG.Wgkyb9XmAdAlBrPMTYqF0owqPZW',
  'user',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert some sample properties
INSERT INTO properties (
  first_name, last_name, property_address, property_city, property_state, property_zip, offer, created_at, updated_at
) VALUES
  ('John', 'Smith', '123 Main St', 'New York', 'NY', '10001', 450000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Jane', 'Doe', '456 Park Ave', 'Boston', 'MA', '02115', 385000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Robert', 'Johnson', '789 Oak Dr', 'Los Angeles', 'CA', '90001', 725000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Sarah', 'Williams', '321 Pine St', 'Chicago', 'IL', '60601', 295000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Michael', 'Brown', '654 Maple Rd', 'Houston', 'TX', '77001', 312000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (property_address, property_city, property_state, property_zip) DO NOTHING;

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables
CREATE TRIGGER update_users_timestamp 
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER update_properties_timestamp 
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER update_upload_jobs_timestamp 
BEFORE UPDATE ON upload_jobs
FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
