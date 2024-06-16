import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const token = __ENV.JWT_TOKEN;
const role = __ENV.USER_ROLE;
const apiUrl = __ENV.API_URL;
const userId = "lkfAz7BTpBTNsPBP1ULMBULzzbm2";

export let errorRate = new Rate("errors");

export let options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp-up to 100 users over 1 minute
    { duration: "3m", target: 500 }, // Ramp-up to 500 users over 1.5 minutes
    { duration: "5m", target: 1000 }, // Ramp-up to 1000 users over 2.5 minutes
    { duration: "5m", target: 1000 }, // Stay at 1000 users for 2.5 minutes
    { duration: "2m", target: 0 }, // Ramp-down to 0 users over 1 minute
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
  },
};

//user enters the dashboard page and retrieve videos and after the user navigates
//to a certain video to retrieve its reviews and then the user navigates to the profile page to retrieve his/her own reviews
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
  errorRate.add(res.status !== 200);
  sleep(1);

  // Assuming the response contains a list of videos
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
    check(res, {
      "is status 200": (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    sleep(1);

    // 3. Fetch reviews from a video
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

  // 4. Fetch reviews from certain user.
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
