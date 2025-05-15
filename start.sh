#!/bin/bash

# Set error handling
set -e

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Starting services without Docker..."
fi

# Start the backend in the background
echo "Starting backend server..."
cd backend
node server.js &
BACKEND_PID=$!

echo "Backend server started on http://localhost:4000"
echo "You can test it with: curl http://localhost:4000/health"

# Move back to the root directory
cd ..

# Start the frontend
echo "Starting frontend server..."
echo "Frontend will be available at http://localhost:5173"
npm start

# When the frontend is stopped, stop the backend
kill $BACKEND_PID 