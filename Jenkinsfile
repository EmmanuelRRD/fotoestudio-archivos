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
                        docker build -t fotoestudio-frontend:latest ./frontend-fotoestudio
                        minikube image load fotoestudio-frontend:latest
                    '''
                }
            }
        }

        stage('3. Análisis con SonarQube') {
            steps {
                script {
                    dir('fotoestudio') {
                        sh '''
                            sonar-scanner \
                              -Dsonar.projectKey=fotoestudio-backend \
                              -Dsonar.sources=. \
                              -Dsonar.host.url=http://localhost:9000 \
                              -Dsonar.login=TU_TOKEN_O_CREDENCIAL
                        '''
                    }
                }
            }
        }

        stage('4. Desplegar en Kubernetes') {
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
