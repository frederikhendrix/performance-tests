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
  console.log(`Starting new iteration at ${new Date().toISOString()}`);

  // Load the frontend homepage
  let res = http.get(frontendUrl, { timeout: "120s" });
  if (!check(res, { "is status 200": (r) => r.status === 200 })) {
    console.log(`Failed to load frontend homepage: ${res.status}`);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  sleep(1);

  // Fetch video metadata with increased timeout
  res = http.get(`${apiUrl}/get/videometa`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-User-Role": role,
    },
    timeout: "120s", //allowes for the call to take up to 120s.
  });
  if (!check(res, { "is status 200": (r) => r.status === 200 })) {
    console.log(`Failed to fetch video metadata: ${res.status}`);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  // Handle response to avoid JSON parse error
  let videos;
  try {
    videos = res.json();
  } catch (e) {
    console.log(`Error parsing JSON response: ${e.message}`);
    errorRate.add(1);
    return;
  }

  sleep(1);

  if (videos && videos.length > 0) {
    let video = videos[0];

    res = http.get(`${apiUrl}/blob/${encodeURIComponent(video.videoName)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-User-Role": role,
      },
      timeout: "120s",
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
      timeout: "120s",
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
    timeout: "120s",
  });
  if (!check(res, { "is status 200": (r) => r.status === 200 })) {
    console.log(`Failed to fetch user reviews: ${res.status}`);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  sleep(1);

  console.log(`Ending iteration at ${new Date().toISOString()}`);
}
