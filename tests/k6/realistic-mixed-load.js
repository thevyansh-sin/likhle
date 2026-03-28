import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const options = {
  scenarios: {
    realistic_mixed_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 2 },
        { duration: '15s', target: 4 },
        { duration: '20s', target: 4 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_429_rate: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const RUN_ID = __ENV.RUN_ID || `${Date.now()}`;
const http429Rate = new Rate('http_429_rate');

const TONES = ['Aesthetic', 'Funny', 'Savage', 'Motivational', 'Romantic', 'Professional', 'Desi'];
const PLATFORM_CHOICES = [
  'Auto Detect',
  'Instagram Caption',
  'Instagram Bio',
  'Reels Hook',
  'WhatsApp Status',
  'Twitter/X Bio',
];
const GENERATE_PROMPTS = [
  'Write a caption for a sunset photo',
  'Make a funny bio for a coder',
  'Write a savage reply to a hater',
  'Write a motivational Monday caption',
  'Write a romantic anniversary status',
  'Write a short hook for a reels intro',
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function buildGeneratePayload() {
  return {
    input: pick(GENERATE_PROMPTS),
    tone: pick(TONES),
    hinglish: 'true',
    emoji: 'true',
    hashtags: 'true',
    platform: pick(PLATFORM_CHOICES),
    length: 'Medium',
    count: String(1 + Math.floor(Math.random() * 2)),
  };
}

function makeHeaders(vuId) {
  return {
    'user-agent': `LikhleK6/mixed/${RUN_ID}/vu-${vuId}`,
  };
}

function recordStatus(res) {
  http429Rate.add(res.status === 429);
}

export default function () {
  const headers = makeHeaders(__VU);
  const shouldGenerate = Math.random() < 0.4;

  if (shouldGenerate) {
    const res = http.post(`${BASE_URL}/api/generate`, buildGeneratePayload(), {
      headers,
    });

    recordStatus(res);
    check(res, {
      'generate returned 200 or 429': (r) => r.status === 200 || r.status === 429,
      'generate body parsed when successful': (r) => r.status !== 200 || r.json().results !== undefined,
    });
  } else {
    const res = http.get(`${BASE_URL}/api/style-dna`, {
      headers,
    });

    recordStatus(res);
    check(res, {
      'style-dna returned 200 or 429': (r) => r.status === 200 || r.status === 429,
      'style-dna body parsed when successful': (r) => r.status !== 200 || r.json().dna !== undefined,
    });
  }

  sleep(8 + Math.random() * 6);
}
