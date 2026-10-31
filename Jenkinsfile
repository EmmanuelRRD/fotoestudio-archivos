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
    steps {
        script {
            def sourceBranch = 'prueba'

            withCredentials([
                string(
                    credentialsId: 'github-token',
                    variable: 'GIT_TOKEN'
                )
            ]) {
                withEnv(["SOURCE_BRANCH=${sourceBranch}"]) {
                    sh '''
                        set -eu

                        echo "Configurando usuario de Git..."
                        git config user.name "Jenkins CI"
                        git config user.email "jenkins@local.domain"

                        echo "Actualizando referencias remotas..."
                        git fetch origin main
                        git fetch origin "$SOURCE_BRANCH"

                        echo "Preparando rama principal..."
                        git checkout -B main origin/main

                        echo "Integrando $SOURCE_BRANCH en main..."

                        git merge --no-ff "origin/$SOURCE_BRANCH" \
                            -m "Merge automático desde $SOURCE_BRANCH [Jenkins]"

                        echo "Preparando autenticación con GitHub..."

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
