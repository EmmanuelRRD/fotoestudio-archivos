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
                        // Construye la imagen normalmente en el Docker local
                        docker build -t fotoestudio-backend:latest ./fotoestudio
                
                        // Carga esa imagen directamente al clúster de Minikube
                        minikube image load fotoestudio-backend:latest
                    '''
                }
            }
        }

        stage('3. Desplegar en Kubernetes') {
            steps {
                script {
                    sh '''
                        minikube update-context
                        
                        // Aplica todos los manifiestos de Kubernetes que están en tu carpeta k8s/
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
