/**
 * Stress Test — FakeStore API
 * Objetivo: aumentar a carga gradualmente para encontrar o limite da API.
 * Rampa: 0 → 200 VUs em etapas, depois resfria.
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 50  },  // Aquece: 0 → 50 VUs
    { duration: '2m', target: 50  },  // Mantém 50 VUs
    { duration: '1m', target: 100 },  // Sobe: 50 → 100 VUs
    { duration: '2m', target: 100 },  // Mantém 100 VUs
    { duration: '1m', target: 200 },  // Pico: 100 → 200 VUs
    { duration: '2m', target: 200 },  // Mantém 200 VUs
    { duration: '1m', target: 0   },  // Resfria: 200 → 0 VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed:   ['rate<0.05'],
    errors:            ['rate<0.05'],
  },
};

const BASE_URL = 'https://fakestoreapi.com';
const HEADERS  = { 'Content-Type': 'application/json' };

export default function () {
  group('Produtos', () => {
    const res = http.get(`${BASE_URL}/products`);
    errorRate.add(!check(res, { 'status 200': (r) => r.status === 200 }));

    sleep(0.3);

    const id = Math.floor(Math.random() * 20) + 1;
    const product = http.get(`${BASE_URL}/products/${id}`);
    errorRate.add(!check(product, { 'produto status 200': (r) => r.status === 200 }));
  });

  sleep(0.5);

  group('Carrinhos', () => {
    const cart = http.get(`${BASE_URL}/carts/1`);
    errorRate.add(!check(cart, { 'cart status 200': (r) => r.status === 200 }));

    sleep(0.3);

    const newCart = http.post(
      `${BASE_URL}/carts`,
      JSON.stringify({
        userId: Math.floor(Math.random() * 10) + 1,
        date: '2024-01-01',
        products: [{ productId: 1, quantity: 1 }],
      }),
      { headers: HEADERS }
    );
    errorRate.add(!check(newCart, { 'POST /carts status 200': (r) => r.status === 200 }));
  });

  sleep(0.5);

  group('Autenticação', () => {
    const login = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ username: 'johnd', password: 'm38rmF$' }),
      { headers: HEADERS }
    );
    errorRate.add(!check(login, { 'login status 200': (r) => r.status === 200 }));
  });

  sleep(1);
}
