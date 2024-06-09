import http from "k6/http";
import { check, sleep } from "k6";

const token = __ENV.JWT_TOKEN;
const role = __ENV.USER_ROLE;
const apiUrl = __ENV.API_URL;

export let options = {
  stages: [
    { duration: "1m", target: 25 }, // Ramp-up to 25 users over 1 minute
    { duration: "1.5m", target: 50 }, // Ramp-up to 50 users over 1.5 minutes
    { duration: "2.5m", target: 100 }, // Ramp-up to 100 users over 2.5 minutes
    { duration: "2.5m", target: 100 }, // Stay at 100 users for 2.5 minutes
    { duration: "1m", target: 0 }, // Ramp-down to 0 users over 1 minute
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests must complete below 2s
  },
};

export default function () {
  let res = http.get(`${apiUrl}/get/videometa`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-User-Role": role,
    },
  });
  check(res, {
    "is status 200": (r) => r.status === 200,
  });
  sleep(1); // Wait for 1 second between requests
}
