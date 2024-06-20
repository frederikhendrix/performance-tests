import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const token = __ENV.JWT_TOKEN;
const role = __ENV.USER_ROLE;
const apiUrl = __ENV.API_URL;
const frontendUrl = __ENV.FRONTEND_URL;
const userId = "lkfAz7BTpBTNsPBP1ULMBULzzbm2";

export let errorRate = new Rate("errors");

export let options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp-up to 100 users over 2 minutes
    { duration: "3m", target: 500 }, // Ramp-up to 500 users over 3 minutes
    { duration: "5m", target: 1000 }, // Ramp-up to 1000 users over 5 minutes
    { duration: "5m", target: 1000 }, // Stay at 1000 users for 5 minutes
    { duration: "2m", target: 0 }, // Ramp-down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests should be below 2 seconds
  },
};

// Simulate user interactions
export default function () {
  // 1. Load the frontend homepage
  let res = http.get(frontendUrl);
  check(res, {
    "is status 200": (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);
  sleep(1);

  // 2. Fetch video metadata
  res = http.get(`${apiUrl}/get/videometa`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-User-Role": role,
    },
  });
  check(res, {
    "is status 200": (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);
  sleep(1);

  // Assuming the response contains a list of videos
  let videos = res.json();
  if (videos.length > 0) {
    let video = videos[0];

    // 3. Fetch video blob
    res = http.get(`${apiUrl}/blob/${encodeURIComponent(video.videoName)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-User-Role": role,
      },
    });
    check(res, {
      "is status 200": (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    sleep(1);

    // 4. Fetch reviews for the video
    res = http.get(`${apiUrl}/get/review/${video.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-User-Role": role,
      },
    });
    check(res, {
      "is status 200": (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    sleep(1);
  }

  // 5. Fetch user reviews
  res = http.get(`${apiUrl}/get/reviews/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-User-Role": role,
    },
  });
  check(res, {
    "is status 200": (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);
  sleep(1);
}
