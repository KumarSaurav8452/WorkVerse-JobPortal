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
                echo 'Writing .env for docker-compose...'
                bat """
                    echo NEO4J_URI=%NEO4J_URI%> .env
                    echo NEO4J_USERNAME=%NEO4J_USERNAME%>> .env
                    echo NEO4J_PASSWORD=%NEO4J_PASSWORD%>> .env
                    echo NEO4J_DATABASE=neo4j>> .env
                    echo JWT_SECRET=%JWT_SECRET%>> .env
                    echo PORT=5000>> .env
                """
                echo 'Stopping and removing old containers...'
                bat 'docker stop workverse-backend || true'
                bat 'docker stop workverse-frontend || true'
                bat 'docker rm workverse-backend || true'
                bat 'docker rm workverse-frontend || true'
                echo 'Starting fresh containers...'
                bat 'docker-compose up -d'
                echo 'Cleaning up .env...'
                bat 'del .env'
                echo 'WorkVerse is live at http://localhost'
            }
        }
    }
    post {
        success { echo 'WorkVerse deployed at http://localhost' }
        failure { echo 'Pipeline failed - check logs' }
    }
}
