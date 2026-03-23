import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 }, // Ramp up to 50 users
    { duration: '5s', target: 200 },  // Spike to 200 users
    { duration: '10s', target: 200 }, // Hold @ 200
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'], // Allow 10% failure during extreme spike
    http_req_duration: ['p(95)<10000'], // 10s max p95 during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const sessionKey = `spike-user-${__VU}`;

  group('Generation Flow', function () {
    const payload = {
      input: 'Spike test prompt',
      tone: 'Desi',
      sessionKey: sessionKey,
    };
    const res = http.post(`${BASE_URL}/api/generate`, payload);
    check(res, { 'gen success': (r) => r.status === 200 });
  });

  group('DNA Flow', function () {
    const res = http.get(`${BASE_URL}/api/style-dna?sessionKey=${sessionKey}`);
    check(res, { 'dna success': (r) => r.status === 200 });
  });

  sleep(1);
}
