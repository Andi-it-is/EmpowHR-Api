import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 1, duration: '30s', thresholds: { http_req_duration: ['p(95)<500'], http_req_failed: ['rate<0.01'] } };

const BASE_URL = 'http://localhost:3000/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5ZmEzY2ZiOS1lN2VmLTQ2N2ItYjVkYy1lNGYzN2VjYmVjMjMiLCJmaXJzdG5hbWUiOiJUZXN0IiwibGFzdG5hbWUiOiJVc2VyIiwiZW1haWwiOiJ0ZXN0QGVtcG93aHIuZGUiLCJyb2xlcyI6WyJIUl9NQU5BR0VSIl0sImRlcGFydG1lbnQiOm51bGwsImlhdCI6MTc4MjQxMzUyNywiZXhwIjoyMTQyNDEzNTI3fQ.TFoJu-3plEnL5kApnn6aHD_WLHYbY_cDkoCnZWug92k';
const headers = { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };

export default function () {
  check(http.get(BASE_URL + '/user/simple', { headers }), { 'user/simple 200': (r) => r.status === 200, 'user/simple <200ms': (r) => r.timings.duration < 200 });
  sleep(0.5);
  check(http.get(BASE_URL + '/certificate', { headers }), { 'certificate 200': (r) => r.status === 200, 'certificate <200ms': (r) => r.timings.duration < 200 });
  sleep(0.5);
  check(http.get(BASE_URL + '/document/my', { headers }), { 'document/my 200': (r) => r.status === 200, 'document/my <200ms': (r) => r.timings.duration < 200 });
  sleep(0.5);
  check(http.post(BASE_URL + '/timeEntry/my/filter', JSON.stringify({}), { headers }), { 'timeEntry/filter 200': (r) => r.status === 200, 'timeEntry/filter <300ms': (r) => r.timings.duration < 300 });
  sleep(0.5);
}
