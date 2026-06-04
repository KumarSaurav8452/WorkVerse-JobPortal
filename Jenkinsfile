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
                withCredentials([
                    string(credentialsId: 'NEO4J_URI', variable: 'DB_URI'),
                    string(credentialsId: 'NEO4J_USERNAME', variable: 'DB_USER'),
                    string(credentialsId: 'NEO4J_PASSWORD', variable: 'DB_PASS'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SEC')
                ]) {
                    bat """docker build -t workverse-backend:latest --build-arg NEO4J_URI=${DB_URI} --build-arg NEO4J_USERNAME=${DB_USER} --build-arg NEO4J_PASSWORD=${DB_PASS} --build-arg JWT_SECRET=${JWT_SEC} ./backend"""
                }
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
                echo 'Starting containers...'
                bat 'docker run -d --name workverse-backend --restart unless-stopped -p 5000:5000 workverse-backend:latest'
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
