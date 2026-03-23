import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    high_frequency_reads: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // Redis should be very stable
    http_req_duration: ['p(95)<500'], // Redis reads should be fast (<500ms)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate different users by varying sessionKey
  const sessionId = Math.floor(Math.random() * 100);
  const sessionKey = `test-user-${sessionId}`;

  const url = `${BASE_URL}/api/style-dna?sessionKey=${sessionKey}`;
  const res = http.get(url);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'has dna': (r) => r.json().dna !== undefined,
  });

  sleep(0.5); // Faster reads
}
