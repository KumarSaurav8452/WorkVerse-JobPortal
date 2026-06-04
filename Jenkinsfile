pipeline {
    agent any
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
        stage('Test') {
            steps {
                dir('backend') { bat 'npm test' }
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
                bat 'call deploy.bat'
            }
        }
    }
    post {
        success { echo 'WorkVerse deployed at http://localhost' }
        failure { echo 'Pipeline failed - check logs above' }
    }
}
