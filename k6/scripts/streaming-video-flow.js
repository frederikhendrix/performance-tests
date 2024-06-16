import http from "k6/http";
import { check, sleep } from "k6";

const token = __ENV.JWT_TOKEN;
const role = __ENV.USER_ROLE;
const apiUrl = __ENV.API_URL;

export let options = {
  stages: [
    { duration: "10s", target: 10 }, // Ramp-up to 10 users over 10 seconds
    { duration: "1m", target: 10 }, // Stay at 10 users for 1 minute
    { duration: "10s", target: 0 }, // Ramp-down to 0 users over 10 seconds
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests must complete below 2000ms
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

  const videos = res.json();

  if (videos.length > 0) {
    const video = videos[0];
    const encodedVideoName = encodeURIComponent(video.videoName);

    res = http.get(`${apiUrl}/blob/${encodedVideoName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-User-Role": role,
      },
    });

    check(res, {
      "is status 200": (r) => r.status === 200,
    });

    const sasUrl = res.json().VideoUrl;

    res = http.get(sasUrl);

    check(res, {
      "is status 200": (r) => r.status === 200,
    });

    // simulating the range requests of videos to see if users can stream videos 1 mb in advance.
    const videoSize = res.headers["Content-Length"];
    const chunkSize = 1024 * 1024; // 1 MB chunks
    for (let start = 0; start < videoSize; start += chunkSize) {
      const end = Math.min(start + chunkSize - 1, videoSize - 1);
      res = http.get(sasUrl, {
        headers: {
          Range: `bytes=${start}-${end}`,
        },
      });

      check(res, {
        "is status 206 or 200": (r) => r.status === 206 || r.status === 200,
      });
    }
  }

  sleep(1); // Wait for 1 second between iterations
}
