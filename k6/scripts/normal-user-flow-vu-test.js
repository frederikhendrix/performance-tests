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
    { duration: "2m", target: 100 },
    { duration: "3m", target: 500 },
    { duration: "5m", target: 1000 },
    { duration: "5m", target: 1000 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  // Log the start of a new virtual user iteration
  console.log(`Starting new iteration at ${new Date().toISOString()}`);

  let res = http.get(frontendUrl);
  if (!check(res, { "is status 200": (r) => r.status === 200 })) {
    console.log(`Failed to load frontend homepage: ${res.status}`);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  sleep(1);

  res = http.get(`${apiUrl}/get/videometa`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-User-Role": role,
    },
  });
  if (!check(res, { "is status 200": (r) => r.status === 200 })) {
    console.log(`Failed to fetch video metadata: ${res.status}`);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  sleep(1);

  let videos = res.json();
  if (videos.length > 0) {
    let video = videos[0];
    res = http.get(`${apiUrl}/blob/${encodeURIComponent(video.videoName)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-User-Role": role,
      },
    });
    if (!check(res, { "is status 200": (r) => r.status === 200 })) {
      console.log(`Failed to fetch video blob: ${res.status}`);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
    sleep(1);

    res = http.get(`${apiUrl}/get/review/${video.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-User-Role": role,
      },
    });
    if (!check(res, { "is status 200": (r) => r.status === 200 })) {
      console.log(`Failed to fetch video reviews: ${res.status}`);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
    sleep(1);
  }

  res = http.get(`${apiUrl}/get/reviews/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-User-Role": role,
    },
  });
  if (!check(res, { "is status 200": (r) => r.status === 200 })) {
    console.log(`Failed to fetch user reviews: ${res.status}`);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  sleep(1);

  // Log the end of the virtual user iteration
  console.log(`Ending iteration at ${new Date().toISOString()}`);
}
