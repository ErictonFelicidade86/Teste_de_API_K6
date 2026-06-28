/**
 * Smoke Test — FakeStore API
 * Objetivo: validar que todos os endpoints principais estão respondendo.
 * Carga mínima: 1 VU por 30 segundos.
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'https://fakestoreapi.com';
const HEADERS = { 'Content-Type': 'application/json' };

export default function () {
  group('Produtos', () => {
    const all = http.get(`${BASE_URL}/products`);
    check(all, {
      'GET /products - status 200': (r) => r.status === 200,
      'GET /products - retorna array': (r) => Array.isArray(r.json()),
      'GET /products - tem itens': (r) => r.json().length > 0,
    });

    const one = http.get(`${BASE_URL}/products/1`);
    check(one, {
      'GET /products/1 - status 200': (r) => r.status === 200,
      'GET /products/1 - tem título': (r) => r.json('title') !== undefined,
      'GET /products/1 - tem preço': (r) => r.json('price') !== undefined,
      'GET /products/1 - tem imagem': (r) => r.json('image') !== undefined,
    });

    const limited = http.get(`${BASE_URL}/products?limit=5`);
    check(limited, {
      'GET /products?limit=5 - status 200': (r) => r.status === 200,
      'GET /products?limit=5 - retorna 5 itens': (r) => r.json().length === 5,
    });

    const sorted = http.get(`${BASE_URL}/products?sort=desc`);
    check(sorted, {
      'GET /products?sort=desc - status 200': (r) => r.status === 200,
    });
  });

  sleep(0.5);

  group('Categorias', () => {
    const categories = http.get(`${BASE_URL}/products/categories`);
    check(categories, {
      'GET /categories - status 200': (r) => r.status === 200,
      'GET /categories - retorna array': (r) => Array.isArray(r.json()),
    });

    const byCategory = http.get(`${BASE_URL}/products/category/electronics`);
    check(byCategory, {
      'GET /category/electronics - status 200': (r) => r.status === 200,
      'GET /category/electronics - retorna produtos': (r) => r.json().length > 0,
    });
  });

  sleep(0.5);

  group('Carrinhos', () => {
    const carts = http.get(`${BASE_URL}/carts`);
    check(carts, {
      'GET /carts - status 200': (r) => r.status === 200,
      'GET /carts - retorna array': (r) => Array.isArray(r.json()),
    });

    const cart = http.get(`${BASE_URL}/carts/1`);
    check(cart, {
      'GET /carts/1 - status 200': (r) => r.status === 200,
      'GET /carts/1 - tem userId': (r) => r.json('userId') !== undefined,
      'GET /carts/1 - tem products': (r) => Array.isArray(r.json('products')),
    });

    const newCart = http.post(
      `${BASE_URL}/carts`,
      JSON.stringify({
        userId: 1,
        date: '2024-01-01',
        products: [{ productId: 1, quantity: 2 }],
      }),
      { headers: HEADERS }
    );
    check(newCart, {
      'POST /carts - status 200': (r) => r.status === 200,
      'POST /carts - retorna id': (r) => r.json('id') !== undefined,
    });
  });

  sleep(0.5);

  group('Usuários', () => {
    const users = http.get(`${BASE_URL}/users`);
    check(users, {
      'GET /users - status 200': (r) => r.status === 200,
      'GET /users - retorna array': (r) => Array.isArray(r.json()),
    });

    const user = http.get(`${BASE_URL}/users/1`);
    check(user, {
      'GET /users/1 - status 200': (r) => r.status === 200,
      'GET /users/1 - tem email': (r) => r.json('email') !== undefined,
      'GET /users/1 - tem username': (r) => r.json('username') !== undefined,
    });
  });

  sleep(0.5);

  group('Autenticação', () => {
    const login = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ username: 'johnd', password: 'm38rmF$' }),
      { headers: HEADERS }
    );
    check(login, {
      'POST /auth/login - status 200': (r) => r.status === 200,
      'POST /auth/login - retorna token': (r) => r.json('token') !== undefined,
    });
  });

  sleep(1);
}
