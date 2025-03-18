FROM node:18 AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY frontend/frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy the entire frontend directory
COPY frontend/frontend ./frontend

# Debug: Verify files are present
RUN cd frontend && ls -la
RUN cd frontend/public && ls -la

# Build the app
RUN cd frontend && REACT_APP_API_URL=/api npm run build

# Copy backend package files and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source and build it
COPY backend ./backend
RUN cd backend && npm run build

# Runtime Stage
FROM node:18

WORKDIR /app

# Copy backend build output
COPY --from=builder /app/backend/dist ./dist

# Copy frontend build output to backend's public directory
COPY --from=builder /app/frontend/frontend/build ./dist/public

# Set working directory to backend dist
WORKDIR /app/dist

# Expose port 3000
EXPOSE 3000

# Start the backend server
CMD ["node", "server.js"]