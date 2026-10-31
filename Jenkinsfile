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

                            echo "Verificando el reporte de SonarQube..."
                            test -s report-task.txt
                            cat report-task.txt
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
    when {
        expression {
            env.BRANCH_NAME &&
            env.BRANCH_NAME != 'main'
        }
    }

    steps {
        script {
            def sourceBranch = env.BRANCH_NAME

            withCredentials([
                usernamePassword(
                    credentialsId: 'github-https',
                    usernameVariable: 'GIT_USERNAME',
                    passwordVariable: 'GIT_TOKEN'
                )
            ]) {
                withEnv(["SOURCE_BRANCH=${sourceBranch}"]) {
                    sh '''
                        set -eu

                        git config user.name "Jenkins CI"
                        git config user.email "jenkins@local.domain"

                        echo "Obteniendo ramas remotas..."

                        git fetch origin main
                        git fetch origin "$SOURCE_BRANCH"

                        echo "Cambiando a main..."

                        git checkout -B main origin/main

                        echo "Fusionando $SOURCE_BRANCH en main..."

                        git merge --no-ff "origin/$SOURCE_BRANCH" \
                          -m "Merge automático desde $SOURCE_BRANCH [Jenkins]"

                        echo "Publicando cambios en GitHub..."

                        AUTH=$(printf '%s' "$GIT_USERNAME:$GIT_TOKEN" | base64 | tr -d '\\n')

                        git -c http.extraheader="AUTHORIZATION: basic $AUTH" \
                          push origin main

                        echo "Merge automático completado."
                    '''
                }
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
