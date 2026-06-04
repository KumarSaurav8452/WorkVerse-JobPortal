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
                echo 'Stopping and removing old containers...'
                bat 'docker stop workverse-backend || true'
                bat 'docker stop workverse-frontend || true'
                bat 'docker rm workverse-backend || true'
                bat 'docker rm workverse-frontend || true'
                echo 'Creating environment file...'
                bat '''
                    (
                        echo NEO4J_URI=neo4j+s://352f051d.databases.neo4j.io
                        echo NEO4J_USERNAME=neo4j
                        echo NEO4J_PASSWORD=DmEY06ibxvAIE9Wx2KLFB5VUJc5mW_Rw2ybnoJdSQhk
                        echo NEO4J_DATABASE=neo4j
                        echo JWT_SECRET=workverse-jwt-secret-2026
                        echo PORT=5000
                    ) > .env
                '''
                echo 'Starting containers...'
                bat 'docker-compose up -d'
                echo 'WorkVerse is live at http://localhost'
            }
        }
    }
    post {
        success { echo 'WorkVerse deployed at http://localhost' }
        failure { echo 'Pipeline failed - check logs' }
    }
}
