import http from "k6/http";
import { check, sleep } from "k6";

const token = __ENV.JWT_TOKEN;
const role = __ENV.USER_ROLE;
const apiUrl = __ENV.API_URL;

export let options = {
  stages: [
    { duration: "1m", target: 100 }, // Ramp-up to 100 users over 1 minute
    { duration: "1.5m", target: 500 }, // Ramp-up to 500 users over 1.5 minutes
    { duration: "2.5m", target: 1000 }, // Ramp-up to 1000 users over 2.5 minutes
    { duration: "2.5m", target: 1000 }, // Stay at 1000 users for 2.5 minutes
    { duration: "1m", target: 0 }, // Ramp-down to 0 users over 1 minute
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
  },
};
// 95% of requests must complete below 2s this value is higher than the performace test because I wouldn't mind
// users having to wait less than 2 seconds during peak times.
console.log("Running file");

export default function () {
  let res = http.get(`http://98.64.211.187/get/videometa`, {
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
