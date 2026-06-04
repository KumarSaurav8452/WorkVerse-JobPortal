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
                withCredentials([
                    string(credentialsId: 'NEO4J_URI', variable: 'DB_URI'),
                    string(credentialsId: 'NEO4J_USERNAME', variable: 'DB_USER'),
                    string(credentialsId: 'NEO4J_PASSWORD', variable: 'DB_PASS'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SEC')
                ]) {
                    script {
                        def envContent = "NEO4J_URI=${DB_URI}\nNEO4J_USERNAME=${DB_USER}\nNEO4J_PASSWORD=${DB_PASS}\nNEO4J_DATABASE=neo4j\nJWT_SECRET=${JWT_SEC}\nPORT=5000"
                        writeFile file: '.env', text: envContent
                    }
                }
                echo 'Starting fresh containers...'
                bat 'docker-compose up -d'
                bat 'del .env 2>nul || true'
                echo 'WorkVerse is live at http://localhost'
            }
        }
    }
    post {
        success { echo 'WorkVerse deployed at http://localhost' }
        failure { echo 'Pipeline failed - check logs' }
    }
}
