# HireMe Project - Docker Setup Guide

This guide will help you set up and run the HireMe project using Docker on any machine (Mac, Linux, Windows).

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)
- Git (to clone the repository if needed)

## Setup Instructions

### 1. Clone the Repository (if needed)

```bash
git clone https://github.com/ayushanandhere/HireMe.git
cd HireMe
```

### 2. Environment Configuration

1. **Backend Configuration**:
   - Copy the example environment file:
     ```bash
     cp backend/.env.docker backend/.env
     ```
   - Edit `backend/.env` to add your actual API keys:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `HF_API_KEY`: Your HuggingFace API key
     - Adjust other settings if needed

2. **Frontend Configuration**:
   - Copy the example environment file:
     ```bash
     cp frontend/.env.docker frontend/.env
     ```
   - The default configuration should work with the Docker setup

### 3. Build and Run with Docker Compose

```bash
docker-compose up -d
```

This command will:
- Build the Docker images for frontend and backend
- Start the MongoDB database
- Connect all services via a Docker network
- Map the necessary ports to your host machine

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017 (accessible from your host machine)

### 5. Stopping the Application

```bash
docker-compose down
```

To remove all data (including the MongoDB volume):

```bash
docker-compose down -v
```

## Development Workflow

### Viewing Logs

```bash
# View logs from all services
docker-compose logs -f

# View logs from a specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Rebuilding After Changes

If you make changes to the code:

```bash
docker-compose build
docker-compose up -d
```

### Accessing the Container Shell

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# MongoDB shell
docker-compose exec mongodb mongosh -u hireme -p hireme_password --authenticationDatabase admin hireme
```

## Troubleshooting

### Connection Issues

If the frontend can't connect to the backend:
1. Check that all containers are running: `docker-compose ps`
2. Verify the environment variables in the frontend's `.env` file
3. Check backend logs for any errors: `docker-compose logs backend`

### Database Connection Issues

If the backend can't connect to MongoDB:
1. Check MongoDB container is running: `docker-compose ps mongodb`
2. Verify the MongoDB connection string in the backend's `.env` file
3. Check MongoDB logs: `docker-compose logs mongodb`

### Port Conflicts

If you see errors about ports being in use:
1. Check if you have any services already using ports 3000, 5000, or 27017
2. Modify the port mappings in `docker-compose.yml` if needed

## Notes on Data Persistence

- MongoDB data is stored in a Docker volume (`mongodb_data`) for persistence
- This ensures your data survives container restarts
- To completely reset the database, use `docker-compose down -v`
