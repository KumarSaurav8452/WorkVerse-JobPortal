@echo off
echo Stopping old containers...
docker stop workverse-backend 2>nul
docker stop workverse-frontend 2>nul
timeout /t 3 /nobreak >nul
docker rm -f workverse-backend 2>nul
docker rm -f workverse-frontend 2>nul
echo Starting backend...
docker run -d --name workverse-backend --restart unless-stopped -p 5000:5000 --env-file deploy.env workverse-backend:latest
echo Starting frontend...
docker run -d --name workverse-frontend --restart unless-stopped -p 80:80 workverse-frontend:latest
timeout /t 3 /nobreak >nul
echo Checking backend logs...
docker logs workverse-backend
echo Done.
