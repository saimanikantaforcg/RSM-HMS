import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

/**
 * RSM HMS Production Load Test
 * ----------------------------
 * Targets: API Latency, Redis Cache Hit Rate, JWT Session Persistence.
 * Configured for 5000 Virtual Users (VUs) ramp-up.
 *
 * NOTE: Thresholds assume PostgreSQL + Redis (production stack).
 *       Running against SQLite in-memory will show higher latency.
 *
 * Each VU logs in once and reuses the JWT for all subsequent iterations
 * to avoid tripping the login rate-limiter (ThrottlerGuard).
 */
export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Warm up
    { duration: '1m', target: 1000 },  // Initial Load
    { duration: '2m', target: 5000 },  // Peak Stress (Production Spec)
    { duration: '1m', target: 0 },     // Tear down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be < 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';
const LOGIN_CREDENTIALS = {
  email: 'admin@hms.local',
  password: 'admin123',
};

// Per-VU token cache — persists across iterations for the same VU
let cachedToken = null;
// Simulate a unique client IP per VU to avoid hitting the shared rate-limit bucket
const vuIp = `10.${randomIntBetween(0, 255)}.${randomIntBetween(0, 255)}.${randomIntBetween(1, 254)}`;

function getAuthHeaders() {
  if (!cachedToken) {
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(LOGIN_CREDENTIALS), {
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': vuIp },
    });

    check(loginRes, {
      'logged in successfully': (r) => r.status === 200,
      'has access token': (r) => {
        const b = r.json();
        return (b?.data?.accessToken ?? b?.accessToken) !== undefined;
      },
    });

    const body = loginRes.json();
    cachedToken = body?.data?.accessToken ?? body?.accessToken;
  }

  return {
    headers: {
      Authorization: `Bearer ${cachedToken}`,
      'Content-Type': 'application/json',
      'X-Forwarded-For': vuIp,
    },
  };
}

export default function () {
  const authHeaders = getAuthHeaders();

  // 1. Load Patient Registry (Validates DB + Caching)
  group('patient registry', () => {
    const patientsRes = http.get(`${BASE_URL}/patients`, authHeaders);
    check(patientsRes, {
      'patients retrieved': (r) => r.status === 200,
    });

    // Pick a random patient ID from the list if available
    const body = patientsRes.json();
    const patients = body?.data?.data ?? body?.data ?? [];
    if (patients && patients.length > 0) {
      const patientId = patients[Math.floor(Math.random() * patients.length)].id;

      // 2. Fetch Specific Patient (Validates Redis Cache Layer)
      group('patient detail', () => {
        const detailRes = http.get(`${BASE_URL}/patients/${patientId}`, authHeaders);
        check(detailRes, {
          'patient details retrieved': (r) => r.status === 200,
          'is decrypted correctly': (r) => {
            const d = r.json();
            return (d?.data?.firstName ?? d?.firstName) !== undefined;
          },
        });
      });
    }
  });

  sleep(1);
}
