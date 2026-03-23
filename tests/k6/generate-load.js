import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'], // Max 5% errors
    http_req_duration: ['p(95)<5000'], // 95% of generation requests (LLM) under 5s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const TONES = ['Aesthetic', 'Funny', 'Savage', 'Motivational', 'Romantic', 'Professional', 'Desi'];
const PROMPTS = [
  'Aesthetic caption for sunset',
  'Funny bio for a coder',
  'Savage reply to a hater',
  'Motivational quote for Monday',
  'Romantic status for anniversary'
];

export default function () {
  const tone = TONES[Math.floor(Math.random() * TONES.length)];
  const input = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  const sessionKey = `test-user-${__VU}`;

  // k6 sends object as multipart/form-data if you use the right structure or boundary
  // For simplicity and compatibility with Next.js req.formData(), we use a multipart body
  const url = `${BASE_URL}/api/generate`;
  
  // Note: k6 handles multipart automatically if data is an object and you don't set Content-Type to something else
  const payload = {
    input: input,
    tone: tone,
    hinglish: 'true',
    emoji: 'true',
    hashtags: 'true',
    platform: 'Instagram Caption',
    length: 'Medium',
    sessionKey: sessionKey,
  };

  const res = http.post(url, payload);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'has results': (r) => r.json().results !== undefined,
  });

  sleep(1);
}
