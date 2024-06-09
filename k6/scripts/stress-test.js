import http from "k6/http";
import { check, sleep } from "k6";

const token = __ENV.JWT_TOKEN;
const role = __ENV.USER_ROLE;
const apiUrl = __ENV.API_URL;

export let options = {
  stages: [
    { duration: "2m", target: 50 }, // Ramp-up to 50 users over 2 minutes
    { duration: "3m", target: 100 }, // Ramp-up to 100 users over 3 minutes
    { duration: "5m", target: 200 }, // Ramp-up to 200 users over 5 minutes
    { duration: "5m", target: 200 }, // Stay at 200 users for 5 minutes
    { duration: "2m", target: 0 }, // Ramp-down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests must complete below 2s
  },
};

export default function () {
  let res = http.get(`${apiUrl}/blob/videoName`, {
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
