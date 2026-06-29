pipeline {
    agent any

    triggers {
        // Executa todo dia às 08:00 e às 20:00
        cron('0 8,20 * * *')
    }

    environment {
        REGISTRY   = 'ghcr.io'
        IMAGE_K6   = 'ghcr.io/erictonfelicidade86/teste_de_api_k6/k6:latest'
        INFLUXDB   = 'http://host.docker.internal:8086/k6'
        K6_NETWORK = 'teste_de_api_k6_k6-monitoring'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Pipeline iniciado: ${new Date()}"
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-credentials',
                    usernameVariable: 'GH_USER',
                    passwordVariable: 'GH_TOKEN'
                )]) {
                    bat 'echo %GH_TOKEN% | docker login ghcr.io -u %GH_USER% --password-stdin'
                }
            }
        }

        stage('Pull Imagem K6') {
            steps {
                bat 'docker pull %IMAGE_K6%'
            }
        }

        stage('Smoke Test') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    bat 'docker run --rm --name k6_smoke --network %K6_NETWORK% -e K6_OUT=influxdb=%INFLUXDB% %IMAGE_K6% run --out influxdb=%INFLUXDB% smoke-test.js'
                }
            }
        }

        stage('Load Test') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    bat 'docker run --rm --name k6_load --network %K6_NETWORK% %IMAGE_K6% run --out influxdb=%INFLUXDB% load-test.js'
                }
            }
        }

        stage('Stress Test') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    bat 'docker run --rm --name k6_stress --network %K6_NETWORK% %IMAGE_K6% run --out influxdb=%INFLUXDB% stress-test.js'
                }
            }
        }

        stage('Spike Test') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    bat 'docker run --rm --name k6_spike --network %K6_NETWORK% %IMAGE_K6% run --out influxdb=%INFLUXDB% spike-test.js'
                }
            }
        }
    }

    post {
        success {
            echo '✅ Todos os testes k6 passaram com sucesso!'
        }
        failure {
            echo '❌ Falha detectada! Verifique os logs acima.'
        }
        always {
            bat 'docker logout ghcr.io'
        }
    }
}
