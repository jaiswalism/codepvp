import http from 'k6/http';
import { sleep, check } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export let options = {
  vus: 100,
  duration: '10m',
};

const BASE_URL = 'http://98.70.44.224:5000/api';

export default function () {
  // --- 1. INITIAL STAGGER ---
  if (__ITER === 0) {
    sleep(randomIntBetween(1, 30));
  }

  const payload = JSON.stringify({
    sourceCode: `print(input()[::-1])`,
    problemId: "reverse-a-string",
    language: "python"
  });

  const params = { headers: { 'Content-Type': 'application/json' } };

  // --- 2. THE INSTANT SUBMISSION ---
  // This should be LIGHTNING FAST (< 100ms)
  let submitRes = http.post(`${BASE_URL}/submit`, payload, params);
  
  check(submitRes, {
    'Submit is Instant (200)': (r) => r.status === 200,
    'Got Submission ID': (r) => r.json().hasOwnProperty('submissionId'),
  });

  if (submitRes.status !== 200) {
    sleep(10);
    return;
  }

  const subId = submitRes.json().submissionId;

  // --- 3. THE "SUBMISSIONS TAB" POLLING ---
  let finished = false;
  let attempts = 0;

  while (!finished && attempts < 60) { // Max 5 minutes of polling
    attempts++;
    sleep(5); // Realistically, the frontend polls every 5s

    let statusRes = http.get(`${BASE_URL}/status/${subId}`);
    
    if (statusRes.status === 200) {
      const data = statusRes.json();
      
      // Log the queue position for visibility
      if (data.status === "Processing") {
        console.log(`VU ${__VU}: In Queue at Position ${data.queuePosition}`);
      }

      if (data.status === "Completed" || data.status === "Error") {
        finished = true;
        check(statusRes, {
          'Judging eventually finished': (r) => r.json().status === "Completed",
        });
      }
    } else {
      break;
    }
  }

  // --- 4. COOL DOWN ---
  // Student moves to next question
  sleep(randomIntBetween(30, 60));
}