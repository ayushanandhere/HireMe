# HireMe Application Environment Setup Guide

## Configuration Structure

The HireMe application uses a typical full-stack structure with separate backend and frontend configurations. This guide explains how environment variables are managed across the application.

## Environment Variables

### Backend Configuration

The backend server requires the following environment variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hireme
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
```

### Frontend Configuration

The frontend only requires the API URL:

```
VITE_API_URL=http://localhost:5000/api
```

## Setup Instructions

1. **Backend Setup**:
   - Copy the `.env.example` file in the backend directory to create a new `.env` file
   - Fill in your actual values for MongoDB, JWT secret, and API keys
   - The OpenAI API key is required for resume parsing functionality

2. **Frontend Setup**:
   - The frontend `.env` file should already be configured correctly
   - Make sure the `VITE_API_URL` points to your backend server

3. **Root Directory**:
   - The root `.env` file serves as a fallback for the backend
   - If the backend cannot find environment variables in its own `.env` file, it will look in the root `.env`

## Dependencies

The application uses a modular dependency structure:

1. **Root `package.json`**:
   - Contains only the OpenAI dependency for the resume parsing feature

2. **Backend `package.json`**:
   - Contains all backend-specific dependencies

3. **Frontend `package.json`**:
   - Contains all frontend-specific dependencies

## Important Notes

- The backend will first try to load environment variables from its own `.env` file
- If certain variables (like `OPENAI_API_KEY`) are not found, it will fall back to the root `.env` file
- For security, all `.env` files are included in `.gitignore` to prevent sensitive information from being committed
- Always use the example files (`.env.example`) as templates when setting up a new environment

## Troubleshooting

If you encounter issues with environment variables:

1. Check if the required variables are set in either the backend or root `.env` file
2. Verify that the server is loading the correct environment file
3. Look for console messages indicating which `.env` file was loaded
4. Ensure that API keys are valid and have the necessary permissions
