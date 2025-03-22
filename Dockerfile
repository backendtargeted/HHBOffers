FROM node:18 AS builder

WORKDIR /app

# Copy package files and install dependencies for frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy frontend source and build it
COPY frontend ./frontend
RUN cd frontend && npm run build

# Copy package files and install dependencies for backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source and build it
COPY backend ./backend
RUN cd backend && npm run build

# Runtime Stage
FROM node:18

WORKDIR /app

# Copy package files for production install
COPY backend/package*.json ./
RUN npm install --only=production

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

# Expose port 5000
EXPOSE 5000

# Start the backend server
CMD ["node", "server.js"]
