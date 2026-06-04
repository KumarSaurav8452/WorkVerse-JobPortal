pipeline {
    agent any
    environment {
        BACKEND_IMAGE  = 'workverse-backend'
        FRONTEND_IMAGE = 'workverse-frontend'
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install Dependencies') {
            steps {
                dir('backend')  { bat 'npm install' }
                dir('frontend') { bat 'npm install' }
            }
        }
        stage('Build Frontend') {
            steps {
                dir('frontend') { bat 'npm run build' }
            }
        }
        stage('Build Docker Images') {
            steps {
                bat 'docker build -t workverse-backend:latest ./backend'
                bat 'docker build -t workverse-frontend:latest ./frontend'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Creating environment file...'
                script {
                    def envText = 'NEO4J_URI=neo4j+s://352f051d.databases.neo4j.io\n'
                    envText += 'NEO4J_USER=neo4j\n'
                    envText += 'NEO4J_USERNAME=neo4j\n'
                    envText += 'NEO4J_PASSWORD=DmEY06ibxvAIE9Wx2KLFB5VUJc5mW_Rw2ybnoJdSQhk\n'
                    envText += 'NEO4J_DATABASE=neo4j\n'
                    envText += 'JWT_SECRET=workverse-jwt-secret-2026\n'
                    envText += 'PORT=5000\n'
                    writeFile file: 'deploy.env', text: envText
                }
                echo 'Stopping old containers...'
                bat 'docker stop workverse-backend 2>nul & docker rm workverse-backend 2>nul & echo done'
                bat 'docker stop workverse-frontend 2>nul & docker rm workverse-frontend 2>nul & echo done'
                echo 'Starting backend...'
                bat 'docker run -d --name workverse-backend --restart unless-stopped -p 5000:5000 --env-file deploy.env workverse-backend:latest'
                echo 'Starting frontend...'
                bat 'docker run -d --name workverse-frontend --restart unless-stopped -p 80:80 workverse-frontend:latest'
                echo 'Verifying...'
                bat 'ping -n 4 127.0.0.1 >nul & docker logs workverse-backend'
                echo 'WorkVerse is live at http://localhost'
            }
        }
    }
    post {
        success { echo 'WorkVerse deployed at http://localhost' }
        failure { echo 'Pipeline failed - check logs' }
    }
}
