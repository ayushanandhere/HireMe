FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Create a default .env file if not provided
RUN touch .env && \
    echo "PORT=5000" >> .env && \
    echo "MONGODB_URI=mongodb://hireme:hireme_password@mongodb:27017/hireme?authSource=admin" >> .env && \
    echo "JWT_SECRET=hireme_jwt_secret_key_should_be_long_and_complex" >> .env && \
    echo "JWT_EXPIRES_IN=30d" >> .env && \
    echo "FRONTEND_URL=http://localhost:3000" >> .env && \
    echo "SOCKET_URL=http://localhost:5000" >> .env

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
