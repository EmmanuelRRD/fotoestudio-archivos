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
                        withSonarQubeEnv('SonarqubeLocal') { 
                            withCredentials([string(credentialsId: 'sonarqubes_jenkins', variable: 'SONAR_TOKEN')]) {
                                sh '''
                                    docker run --rm \
                                      -v "$(pwd)":/usr/src \
                                      -e SONAR_HOST_URL="http://172.17.0.1:9000" \
                                      -e SONAR_TOKEN="${SONAR_TOKEN}" \
                                      sonarsource/sonar-scanner-cli \
                                      -Dsonar.projectKey=fotoestudio-backend \
                                      -Dsonar.sources=.
                                '''
                            }
                        }
                    }
                }
            }
        }

        stage('4. Quality Gate de SonarQube') {
            steps {
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        def qg = waitForQualityGate()
                        if (qg.status != 'OK') {
                            error "El pipeline falló porque el Quality Gate de SonarQube no fue superado: ${qg.status}"
                        }
                    }
                }
            }
        }

        stage('5. Desplegar en Kubernetes') {
            steps {
                script {
                    sh '''
                        minikube update-context
                        kubectl apply -f k8s/
                    '''
                }
            }
        }

        stage('6. Merge Automático') {
            steps {
                script {
                    sh '''
                        git config user.name "Jenkins CI"
                        git config user.email "jenkins@local.domain"
                        
                        git checkout main
                        git pull origin main
                        git merge ${env.BRANCH_NAME} --no-ff -m "Merge automático exitoso desde ${env.BRANCH_NAME} [Jenkins]"
                        git push origin main
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '¡El proyecto fotoestudio se ha analizado, desplegado y fusionado con éxito en main!'
        }
        failure {
            echo 'Hubo un error en el pipeline. Revisa la consola.'
        }
    }
}
