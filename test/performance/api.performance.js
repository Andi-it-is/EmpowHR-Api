import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';
const TOKEN = 'DEIN_JWT_TOKEN';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

export default function () {
  const userRes = http.get(`${BASE_URL}/user/simple`, { headers });
  check(userRes, {
    'user/simple -> 200': (r) => r.status === 200,
    'user/simple -> unter 200ms': (r) => r.timings.duration < 200,
  });
  sleep(0.5);

  const certRes = http.get(`${BASE_URL}/certificate`, { headers });
  check(certRes, {
    'certificate -> 200': (r) => r.status === 200,
    'certificate -> unter 200ms': (r) => r.timings.duration < 200,
  });
  sleep(0.5);

  const docRes = http.get(`${BASE_URL}/document/my`, { headers });
  check(docRes, {
    'document/my -> 200': (r) => r.status === 200,
    'document/my -> unter 200ms': (r) => r.timings.duration < 200,
  });
  sleep(0.5);

  const timeRes = http.post(
    `${BASE_URL}/timeEntry/my/filter`,
    JSON.stringify({}),
    { headers }
  );
  check(timeRes, {
    'timeEntry/my/filter -> 200': (r) => r.status === 200,
    'timeEntry/my/filter -> unter 300ms': (r) => r.timings.duration < 300,
  });
  sleep(0.5);
}