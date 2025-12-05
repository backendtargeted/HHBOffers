FROM node:18 AS builder

WORKDIR /app

# Configure npm with retry logic and registry settings
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy package files and install dependencies for frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --no-audit --no-fund || \
    (echo "First install attempt failed, retrying..." && sleep 10 && npm install --no-audit --no-fund)

# Copy frontend source and build it
COPY frontend ./frontend
RUN cd frontend && npm run build

# Copy package files and install dependencies for backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --no-audit --no-fund || \
    (echo "First install attempt failed, retrying..." && sleep 10 && npm install --no-audit --no-fund)

# Copy backend source and build it
COPY backend ./backend
RUN cd backend && npm run build

# Runtime Stage
FROM node:18

WORKDIR /app

# Configure npm for runtime stage
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy package files for production install
COPY backend/package*.json ./
RUN npm install --only=production --no-audit --no-fund || \
    (echo "First install attempt failed, retrying..." && sleep 10 && npm install --only=production --no-audit --no-fund)

# Copy backend build output
COPY --from=builder /app/backend/dist ./

# Copy frontend build output to public directory
COPY --from=builder /app/frontend/build ./public

# Debug: Verify file structure
RUN echo "=== Checking file structure ===" && \
    ls -la && \
    echo "=== Checking public directory ===" && \
    ls -la public && \
    echo "=== Checking node_modules ===" && \
    ls -la node_modules

# Expose port 3000
EXPOSE 3001

# Start the backend server
CMD ["node", "server.js"]
