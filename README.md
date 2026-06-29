# Teste de API — K6

Testes de performance e carga para a [FakeStore API](https://fakestoreapi.com) usando [k6](https://k6.io/).

## Estrutura

```
k6/
├── tests/
│   ├── smoke-test.js   # Validação básica (1 VU / 30s)
│   ├── load-test.js    # Carga normal (50 VUs / 30s)
│   ├── stress-test.js  # Stress progressivo (até 200 VUs em rampa)
│   └── spike-test.js   # Pico repentino (até 500 VUs em 10s)
└── Dockerfile
```

## Endpoints Cobertos

| Endpoint                          | Método | Testes          |
|-----------------------------------|--------|-----------------|
| `/products`                       | GET    | Smoke, Load, Stress, Spike |
| `/products/:id`                   | GET    | Smoke, Load, Stress |
| `/products?limit=5`               | GET    | Smoke           |
| `/products?sort=desc`             | GET    | Smoke           |
| `/products/categories`            | GET    | Smoke           |
| `/products/category/electronics`  | GET    | Smoke, Load     |
| `/carts`                          | GET    | Smoke           |
| `/carts/:id`                      | GET    | Smoke, Load, Stress |
| `/carts`                          | POST   | Smoke, Load, Stress |
| `/users`                          | GET    | Smoke           |
| `/users/:id`                      | GET    | Smoke, Load     |
| `/auth/login`                     | POST   | Smoke, Load, Stress, Spike |

## Como Executar

### Localmente (k6 instalado)

```bash
# Smoke test — validação rápida
k6 run k6/tests/smoke-test.js

# Load test — carga normal
k6 run k6/tests/load-test.js

# Stress test — carga progressiva
k6 run k6/tests/stress-test.js

# Spike test — pico repentino
k6 run k6/tests/spike-test.js
```

### Via Docker

```bash
# Build da imagem
docker build -t k6-fakestore ./k6

# Load test (padrão)
docker run --rm k6-fakestore

# Escolher outro teste
docker run --rm k6-fakestore run smoke-test.js
docker run --rm k6-fakestore run stress-test.js
docker run --rm k6-fakestore run spike-test.js
```

## Monitoramento com Grafana

A stack de monitoramento permite visualizar as métricas dos testes em tempo real.

```bash
# Subir InfluxDB + Grafana
docker compose up -d

# Acessar o Grafana
http://localhost:3005
```

O dashboard **k6 Load Testing Results** é provisionado automaticamente e exibe:
- Virtual Users ao longo do tempo
- Requests per Second
- Errors per Second
- Latência (mean, max, p90, p95) em tempo real

Para visualizar uma execução ao vivo, suba a stack e dispare o pipeline Jenkins — os dados chegam no Grafana a cada 5 segundos.

## Thresholds

| Teste   | p(95) duração | Taxa de falha |
|---------|--------------|---------------|
| Smoke   | < 1000ms     | < 1%          |
| Load    | < 500ms      | < 1%          |
| Stress  | < 1500ms     | < 5%          |
| Spike   | < 2000ms     | < 10%         |
