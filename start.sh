set -e

echo "-------------------------------------Building sandbox executor image----------------------------------------------------"
docker build -t code-runner-env .
echo "code-runner-env created"

echo "-------------------------------------Building backend image----------------------------------------------------"
cd backend 
docker build -t backend .
echo "backend image builded"

echo "-------------------------------------Building proxy image----------------------------------------------------"
cd ..
cd proxy
docker build -t proxy .
echo "proxy build"

echo "-------------------------------------Building frontend image----------------------------------------------------"
cd ..
cd frontend
docker build -t frontend .
echo "frontend build"

echo "-------------------------------------Building and starting all services----------------------------------------------------"
cd ..
docker compose up --build
echo "Backend is running"