FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Create a .env file with default values if not provided
RUN touch .env && \
    echo "VITE_BACKEND_URL=http://localhost:5001" >> .env && \
    echo "VITE_SOCKET_URL=http://localhost:5001" >> .env

# Expose port 5173 (Vite dev server default port)
EXPOSE 5173

# Start the development server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
