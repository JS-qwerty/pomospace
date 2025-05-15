#!/bin/bash

# Make sure Docker is running
echo "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/focusflow"
JWT_SECRET="your-secret-key-here-change-in-production"
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
EOL
fi

# Start PostgreSQL with Docker Compose
echo "Starting PostgreSQL with Docker Compose..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create database migrations
echo "Creating database migrations..."
npx prisma migrate dev --name init

# Build the application
echo "Building the application..."
npm run build

echo "Setup complete. Run 'npm run dev' to start the development server." 