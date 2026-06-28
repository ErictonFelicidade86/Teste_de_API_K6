/**
 * Spike Test — FakeStore API
 * Objetivo: simular um pico repentino de tráfego (ex: promoção, viral).
 * Sobe de 5 para 500 VUs em 10 segundos, mantém por 1 min e desce.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: 5   },  // Tráfego normal
    { duration: '10s', target: 500 },  // Spike repentino
    { duration: '1m',  target: 500 },  // Mantém o pico
    { duration: '10s', target: 5   },  // Volta ao normal
    { duration: '30s', target: 5   },  // Recuperação
    { duration: '10s', target: 0   },  // Finaliza
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // Mais tolerante no spike
    http_req_failed:   ['rate<0.10'],   // Até 10% de falha aceitável no pico
    errors:            ['rate<0.10'],
  },
};

const BASE_URL = 'https://fakestoreapi.com';

export default function () {
  const res = http.get(`${BASE_URL}/products`);
  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'responde em < 2s': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!ok);

  sleep(1);
}
