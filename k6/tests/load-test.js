/**
 * Load Test — FakeStore API
 * Objetivo: validar comportamento da API sob carga normal.
 * 50 usuários virtuais simultâneos por 30 segundos.
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const productDuration = new Trend('product_duration');
const cartDuration    = new Trend('cart_duration');
const loginDuration   = new Trend('login_duration');
const errorRate       = new Rate('errors');
const requestCount    = new Counter('requests_total');

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration:  ['p(95)<500'],
    http_req_failed:    ['rate<0.05'],     // menos de 5% de falha
    errors:             ['rate<0.05'],
    product_duration:   ['p(95)<400'],
    login_duration:     ['p(95)<600'],
  },
};

const BASE_URL = 'https://fakestoreapi.com';
const HEADERS  = { 'Content-Type': 'application/json' };

export default function () {
  group('Produtos', () => {
    const res = http.get(`${BASE_URL}/products`);
    const ok = check(res, {
      'GET /products - status 200': (r) => r.status === 200,
      'GET /products - body não vazio': (r) => r.body.length > 0,
    });
    productDuration.add(res.timings.duration);
    errorRate.add(!ok);
    requestCount.add(1);

    sleep(0.3);

    const id = Math.floor(Math.random() * 20) + 1;
    const product = http.get(`${BASE_URL}/products/${id}`);
    const okProduct = check(product, {
      [`GET /products/${id} - status 200`]: (r) => r.status === 200,
      'produto tem id':    (r) => r.json('id') !== undefined,
      'produto tem preço': (r) => r.json('price') !== undefined,
    });
    productDuration.add(product.timings.duration);
    errorRate.add(!okProduct);
    requestCount.add(1);

    sleep(0.3);

    const byCategory = http.get(`${BASE_URL}/products/category/electronics`);
    check(byCategory, {
      'GET /category/electronics - status 200': (r) => r.status === 200,
    });
    requestCount.add(1);
  });

  sleep(0.5);

  group('Carrinhos', () => {
    const cartId = Math.floor(Math.random() * 7) + 1;
    const cart = http.get(`${BASE_URL}/carts/${cartId}`);
    const okCart = check(cart, {
      [`GET /carts/${cartId} - status 200`]: (r) => r.status === 200,
      'carrinho tem userId':   (r) => r.json('userId') !== undefined,
      'carrinho tem products': (r) => Array.isArray(r.json('products')),
    });
    cartDuration.add(cart.timings.duration);
    errorRate.add(!okCart);
    requestCount.add(1);

    sleep(0.3);

    const newCart = http.post(
      `${BASE_URL}/carts`,
      JSON.stringify({
        userId: Math.floor(Math.random() * 10) + 1,
        date: '2024-01-01',
        products: [
          { productId: Math.floor(Math.random() * 20) + 1, quantity: 1 },
        ],
      }),
      { headers: HEADERS }
    );
    check(newCart, {
      'POST /carts - status 200': (r) => r.status === 200,
      'POST /carts - retorna id': (r) => r.json('id') !== undefined,
    });
    requestCount.add(1);
  });

  sleep(0.5);

  group('Usuários', () => {
    const userId = Math.floor(Math.random() * 10) + 1;
    const user = http.get(`${BASE_URL}/users/${userId}`);
    check(user, {
      [`GET /users/${userId} - status 200`]: (r) => r.status === 200,
      'usuário tem email': (r) => r.json('email') !== undefined,
    });
    requestCount.add(1);
  });

  sleep(0.5);

  group('Autenticação', () => {
    const login = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ username: 'johnd', password: 'm38rmF$' }),
      { headers: HEADERS }
    );
    const okLogin = check(login, {
      'POST /auth/login - status 200': (r) => r.status === 200,
      'POST /auth/login - tem token':  (r) => r.json('token') !== undefined,
    });
    loginDuration.add(login.timings.duration);
    errorRate.add(!okLogin);
    requestCount.add(1);
  });

  sleep(1);
}
