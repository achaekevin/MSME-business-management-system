import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                  // Error rate < 1%
    errors: ['rate<0.1'],                            // Custom error rate < 10%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api';

// Test data
let authToken = '';
let testUserId = '';
let testProductId = '';
let testCustomerId = '';

export function setup() {
  // Register and login to get auth token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'admin@ssme.com',
    password: 'admin1',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginData = JSON.parse(loginRes.body);
  
  return {
    token: loginData.data.token,
    userId: loginData.data.user.id,
  };
}

export default function (data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`,
    },
  };

  // ── Test 1: Dashboard ───────────────────────────────────────────────────
  group('Dashboard', () => {
    const res = http.get(`${BASE_URL}/dashboard`, params);
    
    check(res, {
      'dashboard status 200': (r) => r.status === 200,
      'dashboard has data': (r) => JSON.parse(r.body).success === true,
    }) || errorRate.add(1);
    
    sleep(1);
  });

  // ── Test 2: Products List ───────────────────────────────────────────────
  group('Products', () => {
    const res = http.get(`${BASE_URL}/products?page=1&limit=20`, params);
    
    check(res, {
      'products status 200': (r) => r.status === 200,
      'products list returned': (r) => {
        const body = JSON.parse(r.body);
        return body.success && Array.isArray(body.data.data);
      },
    }) || errorRate.add(1);
    
    sleep(1);
  });

  // ── Test 3: Customers List ──────────────────────────────────────────────
  group('Customers', () => {
    const res = http.get(`${BASE_URL}/customers?page=1&limit=20`, params);
    
    check(res, {
      'customers status 200': (r) => r.status === 200,
      'customers list returned': (r) => {
        const body = JSON.parse(r.body);
        return body.success && Array.isArray(body.data.data);
      },
    }) || errorRate.add(1);
    
    sleep(1);
  });

  // ── Test 4: Inventory ───────────────────────────────────────────────────
  group('Inventory', () => {
    const res = http.get(`${BASE_URL}/inventory?page=1&limit=20`, params);
    
    check(res, {
      'inventory status 200': (r) => r.status === 200,
      'inventory returned': (r) => JSON.parse(r.body).success === true,
    }) || errorRate.add(1);
    
    sleep(1);
  });

  // ── Test 5: Sales List ──────────────────────────────────────────────────
  group('Sales', () => {
    const res = http.get(`${BASE_URL}/sales?page=1&limit=20`, params);
    
    check(res, {
      'sales status 200': (r) => r.status === 200,
      'sales list returned': (r) => {
        const body = JSON.parse(r.body);
        return body.success && Array.isArray(body.data.data);
      },
    }) || errorRate.add(1);
    
    sleep(1);
  });

  // ── Test 6: Reports ─────────────────────────────────────────────────────
  group('Reports', () => {
    const res = http.get(`${BASE_URL}/reports/sales?period=week`, params);
    
    check(res, {
      'reports status 200': (r) => r.status === 200,
      'report data returned': (r) => JSON.parse(r.body).success === true,
    }) || errorRate.add(1);
    
    sleep(2);
  });

  // Random sleep between iterations (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Load test completed');
}
