pipeline {
    agent any

    stages {
        stage('1. Verificar Código') {
            steps {
                // Obtiene la última versión de tu repositorio de GitHub
                // (Si usas un Webhook, Jenkins clonará automáticamente los cambios)
                checkout scm
            }
        }

        stage('2. Construir Imagen en Minikube') {
            steps {
                script {
                    // Este comando apunta temporalmente el entorno de Docker al daemon interno de Minikube.
                    // Así, la imagen se crea "dentro" de Minikube sin subirla a Docker Hub.
                    sh '''
                        eval $(minikube docker-env)
                        docker build -t fotoestudio-app:latest .
                    '''
                }
            }
        }

        stage('3. Desplegar en Kubernetes') {
            steps {
                script {
                    sh '''
                        // Asegura el contexto y aplica o reinicia tus manifiestos de Kubernetes
                        minikube update-context
                        
                        // Si ya tienes un deployment creado, esto fuerza a que tome la nueva imagen:
                        kubectl rollout restart deployment/fotoestudio-deployment
                        
                        // O si prefieres aplicar directamente tus YAMLs:
                        // kubectl apply -f k8s/
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '¡Pipeline ejecutado con éxito y desplegado en Minikube!'
        }
        failure {
            echo 'Hubo un error en el pipeline. Revisa los logs.'
        }
    }
}
