import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "10s", target: 10 }, // Ramp-up to 10 users over 10 seconds
    { duration: "1m", target: 10 }, // Stay at 10 users for 1 minute
    { duration: "10s", target: 0 }, // Ramp-down to 0 users over 10 seconds
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
  },
};

export default function () {
  let res = http.get("http:///watch-movie");
  check(res, {
    "is status 200": (r) => r.status === 200,
  });
  sleep(1); // Wait for 1 second between requests
}
