FROM node:20-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Clean install dependencies
RUN rm -rf node_modules package-lock.json
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Create a .env file with default values if not provided
RUN touch .env && \
    echo "VITE_BACKEND_URL=http://localhost:5001" >> .env && \
    echo "VITE_SOCKET_URL=http://localhost:5001" >> .env

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx configuration for React routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
