FROM node:18 as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Use a lightweight Node image for the production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the application
RUN npm install -g serve

# Copy the build folder from the build stage
COPY --from=build /app/build .

# Expose the default port for serve (3001)
EXPOSE 3001

# Run the application using serve
CMD ["serve", "-s", ".", "-l", "3001"]