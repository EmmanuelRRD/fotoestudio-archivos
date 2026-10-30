pipeline {
    agent any

    stages {
        stage('1. Verificar Código') {
            steps {
                checkout scm
            }
        }

        stage('2. Construir e Cargar en Minikube') {
            steps {
                script {
                    sh '''
                        docker build -t fotoestudio-backend:latest ./fotoestudio
                        minikube image load fotoestudio-backend:latest
                        docker build -t fotoestudio-frontend:latest ./frontend
                        minikube image load fotoestudio-frontend:latest
                    '''
                }
            }
        }

        stage('3. Desplegar en Kubernetes') {
            steps {
                script {
                    sh '''
                        minikube update-context
                        kubectl apply -f k8s/
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '¡El backend de fotoestudio se ha desplegado con éxito en Minikube!'
        }
        failure {
            echo 'Hubo un error en el pipeline. Revisa la consola.'
        }
    }
}
