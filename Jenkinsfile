
/*
 * Función auxiliar para enviar notificaciones a Slack.
 * Si Slack falla, no interrumpe el pipeline.
 */
def enviarSlack(String color, String mensaje) {
    try {
        slackSend(
            channel: '#agente1',
            color: color,
            message: mensaje
        )
    } catch (Exception e) {
        echo "No se pudo enviar la notificación a Slack: ${e.message}"
    }
}

/*
 * Notificación de resultados individuales.
 */
def notificarEtapa(String etapa, String estado) {
    def color = estado == 'SUCCESS' ? 'good' : 'danger'
    def emoji = estado == 'SUCCESS' ? ':white_check_mark:' : ':x:'

    enviarSlack(
        color,
        """
${emoji} *FOTOESTUDIO - ${estado}*

*Etapa:* ${etapa}
*Build:* #${env.BUILD_NUMBER}
*Proyecto:* ${env.JOB_NAME}

<${env.BUILD_URL}|Ver ejecución en Jenkins>
"""
    )
}


pipeline {
    agent any

    stages {

        // 1. Obtener código fuente
        stage('1. Verificar Código') {
            steps {
                script {
                    enviarSlack(
                        '#439FE0',
                        """
:rocket: *FOTOESTUDIO - PIPELINE INICIADO*

*Proyecto:* ${env.JOB_NAME}
*Build:* #${env.BUILD_NUMBER}
*Estado:* INICIANDO

<${env.BUILD_URL}|Ver ejecución en Jenkins>
"""
                    )
                }

                checkout scm
            }

            post {
                success {
                    script {
                        notificarEtapa('Verificar Código', 'SUCCESS')
                    }
                }
                failure {
                    script {
                        notificarEtapa('Verificar Código', 'FAILURE')
                    }
                }
            }
        }


        // 2. Construir imágenes y cargarlas en Minikube
        stage('2. Construir e Cargar en Minikube') {
            steps {
                script {
                    sh '''
                        set -eu

                        docker build -t fotoestudio-backend:latest ./fotoestudio
                        minikube image load fotoestudio-backend:latest

                        docker build -t fotoestudio-frontend:latest ./frontend-fotoestudio
                        minikube image load fotoestudio-frontend:latest
                    '''
                }
            }

            post {
                success {
                    script {
                        notificarEtapa('Construcción y carga de imágenes', 'SUCCESS')
                    }
                }
                failure {
                    script {
                        notificarEtapa('Construcción y carga de imágenes', 'FAILURE')
                    }
                }
            }
        }


        // 3. Análisis estático con SonarQube
        stage('3. Análisis con SonarQube') {
            steps {
                script {
                    dir('fotoestudio') {
                        withSonarQubeEnv('SonarqubeLocal') {
                            withCredentials([
                                string(
                                    credentialsId: 'sonarqubes_jenkins',
                                    variable: 'SONAR_TOKEN'
                                )
                            ]) {
                                sh '''
                                    set -eu

                                    rm -f report-task.txt

                                    docker run --rm \
                                      -v "$(pwd)":/usr/src \
                                      -w /usr/src \
                                      -e SONAR_HOST_URL="http://172.17.0.1:9000" \
                                      -e SONAR_TOKEN="${SONAR_TOKEN}" \
                                      sonarsource/sonar-scanner-cli \
                                      -Dsonar.projectKey=fotoestudio-backend \
                                      -Dsonar.sources=. \
                                      -Dsonar.scanner.metadataFilePath=/usr/src/report-task.txt

                                    echo "Verificando reporte de SonarQube..."
                                    test -s report-task.txt
                                    cat report-task.txt
                                '''
                            }
                        }
                    }
                }
            }

            post {
                success {
                    script {
                        notificarEtapa('Análisis estático SonarQube', 'SUCCESS')
                    }
                }
                failure {
                    script {
                        notificarEtapa('Análisis estático SonarQube', 'FAILURE')
                    }
                }
            }
        }


        // 4. Esperar y validar Quality Gate
        stage('4. Quality Gate de SonarQube') {
            steps {
                script {
                    timeout(time: 5, unit: 'MINUTES') {
                        def qg = waitForQualityGate()

                        if (qg.status != 'OK') {
                            error "El Quality Gate de SonarQube no fue superado: ${qg.status}"
                        }

                        echo "Quality Gate superado correctamente."
                    }
                }
            }

            post {
                success {
                    script {
                        enviarSlack(
                            'good',
                            """
:shield: *SONARQUBE - QUALITY GATE SUPERADO*

*Proyecto:* Fotoestudio
*Estado:* PASSED
*Build:* #${env.BUILD_NUMBER}

<${env.BUILD_URL}|Ver ejecución en Jenkins>
"""
                        )
                    }
                }

                failure {
                    script {
                        enviarSlack(
                            'danger',
                            """
:warning: *SONARQUBE - QUALITY GATE RECHAZADO O FALLIDO*

*Proyecto:* Fotoestudio
*Estado:* FAILED
*Build:* #${env.BUILD_NUMBER}

Revisa los resultados del análisis en SonarQube.

<${env.BUILD_URL}|Ver ejecución en Jenkins>
"""
                        )
                    }
                }
            }
        }


        // 5. Desplegar en Kubernetes
        stage('5. Desplegar en Kubernetes') {
            steps {
                script {
                    sh '''
                        set -eu

                        minikube update-context
                        kubectl apply -f k8s/
                    '''
                }
            }

            post {
                success {
                    script {
                        notificarEtapa('Despliegue en Kubernetes', 'SUCCESS')
                    }
                }
                failure {
                    script {
                        notificarEtapa('Despliegue en Kubernetes', 'FAILURE')
                    }
                }
            }
        }


        // 6. Integrar prueba en main
        stage('6. Merge Automático') {
            steps {
                script {
                    def sourceBranch = 'prueba'

                    withCredentials([
                        string(
                            credentialsId: 'GIT_TOKEN',
                            variable: 'GIT_TOKEN'
                        )
                    ]) {
                        withEnv(["SOURCE_BRANCH=${sourceBranch}"]) {
                            sh '''
                                set -eu

                                echo "Configurando usuario de Git..."
                                git config user.name "Jenkins CI"
                                git config user.email "jenkins@local.domain"

                                echo "Actualizando ramas remotas..."
                                git fetch origin main
                                git fetch origin "$SOURCE_BRANCH"

                                echo "Preparando rama principal..."
                                git checkout -B main origin/main

                                echo "Integrando $SOURCE_BRANCH en main..."

                                git merge --no-ff "origin/$SOURCE_BRANCH" \
                                    -m "Merge automático desde $SOURCE_BRANCH [Jenkins]"

                                echo "Preparando autenticación..."

                                export GIT_ASKPASS="$(pwd)/.git-askpass"
                                export GIT_TERMINAL_PROMPT=0

                                cat > "$GIT_ASKPASS" <<'EOF'
#!/bin/sh
case "$1" in
    *Username*) echo "x-access-token" ;;
    *Password*) echo "$GIT_TOKEN" ;;
    *) exit 1 ;;
esac
EOF

                                chmod 700 "$GIT_ASKPASS"

                                trap 'rm -f "$GIT_ASKPASS"' EXIT

                                echo "Enviando cambios a GitHub..."
                                git push origin main

                                echo "Merge automático completado correctamente."
                            '''
                        }
                    }
                }
            }

            post {
                success {
                    script {
                        notificarEtapa('Merge automático en main', 'SUCCESS')
                    }
                }
                failure {
                    script {
                        notificarEtapa('Merge automático en main', 'FAILURE')
                    }
                }
            }
        }
    }


    // Acciones posteriores al pipeline
    post {

        always {
            script {
                def resultado = currentBuild.currentResult ?: 'UNKNOWN'

                def color = resultado == 'SUCCESS' ? 'good' :
                            resultado == 'UNSTABLE' ? 'warning' :
                            resultado == 'ABORTED' ? '#808080' : 'danger'

                def emoji = resultado == 'SUCCESS' ? ':tada:' :
                            resultado == 'UNSTABLE' ? ':warning:' :
                            resultado == 'ABORTED' ? ':no_entry_sign:' : ':x:'

                enviarSlack(
                    color,
                    """
${emoji} *FOTOESTUDIO - RESULTADO FINAL DEL PIPELINE*

*Proyecto:* ${env.JOB_NAME}
*Build:* #${env.BUILD_NUMBER}
*Resultado:* ${resultado}
*Duración:* ${currentBuild.durationString}

*Etapas:* 6
*Destino:* Kubernetes / Minikube
*Integración Git:* main

<${env.BUILD_URL}|Ver detalles completos en Jenkins>
"""
                )
            }
        }
    }
}
