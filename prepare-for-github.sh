#!/bin/bash

# Script to prepare HireMe project for GitHub and ensure Docker compatibility
echo "Preparing HireMe project for GitHub and Docker compatibility..."

# Set text colors for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${YELLOW}Step 1: Cleaning up sensitive information and unnecessary files...${NC}"

# Backup original .env files
echo -e "${YELLOW}Creating backups of environment files...${NC}"
mkdir -p .env-backups

if [ -f backend/.env ]; then
  cp backend/.env .env-backups/backend.env
  echo -e "${GREEN}✓ Backed up backend/.env${NC}"
fi

if [ -f frontend/.env ]; then
  cp frontend/.env .env-backups/frontend.env
  echo -e "${GREEN}✓ Backed up frontend/.env${NC}"
fi

# Create sanitized versions of .env files
echo -e "${YELLOW}Creating sanitized versions of .env files...${NC}"

if [ -f backend/.env ]; then
  # Create sanitized version without API keys
  cat backend/.env | sed 's/\(OPENAI_API_KEY=\).*/\1your_openai_api_key_here/' | \
                     sed 's/\(HF_API_KEY=\).*/\1your_huggingface_api_key_here/' | \
                     sed 's/\(JWT_SECRET=\).*/\1your_jwt_secret_key_here/' > backend/.env.sanitized
  
  # Replace original with sanitized version
  mv backend/.env.sanitized backend/.env
  echo -e "${GREEN}✓ Sanitized backend/.env${NC}"
fi

# Ensure .gitignore exists and is comprehensive
echo -e "${YELLOW}Setting up .gitignore file...${NC}"
cat > .gitignore << EOL
# Dependencies
node_modules/
/.pnp
.pnp.js

# Environment variables - protect all .env files except examples
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
# Keep example files for reference
!.env.example
!.env.docker

# Build outputs
/dist/
/build/
/frontend/dist/
/frontend/build/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Testing
/coverage
/.nyc_output

# Editor directories and files
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.DS_Store

# Temporary files
*.tmp
*.temp
.cache/
.temp/

# Uploads and generated content
/uploads/
/public/uploads/
/backend/uploads/

# Docker related
docker-compose.override.yml

# System Files
.DS_Store
Thumbs.db

# Backup directory
.env-backups/

# Docker installation script
get-docker.sh
EOL

echo -e "${GREEN}✓ Created comprehensive .gitignore file${NC}"

# Make sure the Docker setup files are in place
echo -e "${YELLOW}Step 2: Checking Docker setup files...${NC}"
if [ ! -f docker-compose.yml ]; then
  echo -e "${RED}ERROR: docker-compose.yml is missing!${NC}"
  exit 1
fi

if [ ! -f backend/Dockerfile ]; then
  echo -e "${RED}ERROR: backend/Dockerfile is missing!${NC}"
  exit 1
fi

if [ ! -f frontend/Dockerfile ]; then
  echo -e "${RED}ERROR: frontend/Dockerfile is missing!${NC}"
  exit 1
fi

echo -e "${GREEN}✓ All Docker setup files are in place${NC}"

# Update README.md with Docker setup information
echo -e "${YELLOW}Step 3: Updating README.md with Docker setup information...${NC}"
if [ ! -f README.md ]; then
  echo -e "${GREEN}Creating README.md with Docker setup instructions...${NC}"
  cp DOCKER_SETUP.md README.md
else
  # Check if Docker setup is already in README.md
  if ! grep -q "Docker Setup Guide" README.md; then
    echo -e "${GREEN}Appending Docker setup instructions to existing README.md...${NC}"
    echo -e "\n\n## Docker Setup\n" >> README.md
    cat DOCKER_SETUP.md >> README.md
  else
    echo -e "${GREEN}Docker setup information already exists in README.md${NC}"
  fi
fi

# Create example environment files if they don't exist
echo -e "${YELLOW}Step 4: Setting up environment example files...${NC}"

# Backend .env.example
if [ ! -f backend/.env.example ]; then
  cat > backend/.env.example << EOL
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hireme
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=30d
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
HF_API_KEY=your_huggingface_api_key_here
FRONTEND_URL=http://localhost:3000
SOCKET_URL=http://localhost:5000
EOL
  echo -e "${GREEN}✓ Created backend/.env.example${NC}"
fi

# Frontend .env.example
if [ ! -f frontend/.env.example ]; then
  cat > frontend/.env.example << EOL
VITE_BACKEND_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
EOL
  echo -e "${GREEN}✓ Created frontend/.env.example${NC}"
fi

# Step 5: Clean up unnecessary files
echo -e "${YELLOW}Step 5: Cleaning up unnecessary files...${NC}"

# Remove Docker installation script if it exists
if [ -f get-docker.sh ]; then
  rm get-docker.sh
  echo -e "${GREEN}✓ Removed get-docker.sh${NC}"
fi

# Remove any log files
find . -name "*.log" -type f -delete
echo -e "${GREEN}✓ Removed log files${NC}"

# Remove any temporary files
find . -name "*.tmp" -type f -delete
find . -name "*.temp" -type f -delete
echo -e "${GREEN}✓ Removed temporary files${NC}"

# Remove any OS-specific files
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
echo -e "${GREEN}✓ Removed OS-specific files${NC}"

# Final check for sensitive information
echo -e "${YELLOW}Step 6: Final check for sensitive information...${NC}"

# Check for API keys in files
echo -e "${YELLOW}Checking for potential API keys in code...${NC}"
GREP_RESULT=$(grep -r "API_KEY" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" .)

if [ ! -z "$GREP_RESULT" ]; then
  echo -e "${RED}WARNING: Potential API keys found in code:${NC}"
  echo "$GREP_RESULT"
  echo -e "${RED}Please review these files and remove any hardcoded API keys before pushing to GitHub.${NC}"
else
  echo -e "${GREEN}✓ No API keys found hardcoded in source files${NC}"
fi

# Make the script executable
chmod +x prepare-for-github.sh

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}✓ Your HireMe project is now ready for GitHub!${NC}"
echo -e "${GREEN}============================================${NC}"

echo -e "\n${YELLOW}To run the project on any machine with Docker:${NC}"
echo -e "1. Clone the repository"
echo -e "2. Copy .env.example to .env in both backend and frontend directories"
echo -e "3. Update the .env files with your actual API keys and settings"
echo -e "4. Run 'docker-compose up -d'"
echo -e "5. Access the application at http://localhost:3000"

echo -e "\n${YELLOW}IMPORTANT: Before pushing to GitHub:${NC}"
echo -e "1. Verify that no sensitive API keys or credentials are in your code"
echo -e "2. Confirm that .env files are properly excluded by .gitignore"
echo -e "3. Make sure .env.example and .env.docker files are included for reference"
echo -e "4. Test that your Docker setup works correctly"

echo -e "\n${GREEN}Your original .env files have been backed up to .env-backups/ directory${NC}"
echo -e "${GREEN}Restore them if needed after pushing to GitHub${NC}"

