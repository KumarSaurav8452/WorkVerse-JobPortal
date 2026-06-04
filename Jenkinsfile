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
            environment {
                NEO4J_URI      = credentials('NEO4J_URI')
                NEO4J_USERNAME = credentials('NEO4J_USERNAME')
                NEO4J_PASSWORD = credentials('NEO4J_PASSWORD')
                JWT_SECRET     = credentials('JWT_SECRET')
            }
            steps {
                echo 'Stopping and removing old containers...'
                bat 'docker stop workverse-backend || true'
                bat 'docker stop workverse-frontend || true'
                bat 'docker rm workverse-backend || true'
                bat 'docker rm workverse-frontend || true'
                echo 'Starting backend container...'
                bat """docker run -d --name workverse-backend --restart unless-stopped -p 5000:5000 -e NEO4J_URI=%NEO4J_URI% -e NEO4J_USER=%NEO4J_USERNAME% -e NEO4J_USERNAME=%NEO4J_USERNAME% -e NEO4J_PASSWORD=%NEO4J_PASSWORD% -e NEO4J_DATABASE=neo4j -e JWT_SECRET=%JWT_SECRET% -e PORT=5000 workverse-backend:latest"""
                echo 'Starting frontend container...'
                bat 'docker run -d --name workverse-frontend --restart unless-stopped -p 80:80 workverse-frontend:latest'
                echo 'WorkVerse is live at http://localhost'
            }
        }
    }
    post {
        success { echo 'WorkVerse deployed at http://localhost' }
        failure { echo 'Pipeline failed - check logs' }
    }
}
