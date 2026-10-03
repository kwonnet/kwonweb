import test from "node:test";
import assert from "node:assert/strict";
import {
  uploadStreamVideo,
  waitForVideoPoll,
} from "../src/utils/stream-upload.ts";
const id = "a".repeat(32),
  url = `https://customer-example.cloudflarestream.com/${id}/manifest/video.m3u8`;
const file = new File(["video-bytes"], "video.mp4", {
  type: "video/mp4",
  lastModified: 123,
});
const session = {
  id,
  uploadUrl: `https://upload.videodelivery.net/tus/${id}`,
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  maxDurationSeconds: 600,
};
const ready = {
  ready: true,
  failed: false,
  state: "ready",
  progress: 100,
  url,
  thumbnailUrl: `https://customer-example.cloudflarestream.com/${id}/thumbnails/thumbnail.jpg`,
  width: 1280,
  height: 720,
};
function setup(t, fetcher) {
  const data = new Map();
  t.mock.method(globalThis, "fetch", fetcher);
  const original = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      get length() {
        return data.size;
      },
      key: (i) => [...data.keys()][i],
      getItem: (k) => data.get(k) || null,
      setItem: (k, v) => data.set(k, v),
      removeItem: (k) => data.delete(k),
    },
  });
  t.after(() =>
    original
      ? Object.defineProperty(globalThis, "sessionStorage", original)
      : delete globalThis.sessionStorage,
  );
  return data;
}
test("uploads via tus, waits for processing, and reuses ready upload after post failure", async (t) => {
  let creates = 0,
    uploads = 0,
    polls = 0;
  const phases = [];
  setup(t, async (_url, options) => {
    if (options.method === "POST") {
      creates++;
      return Response.json(session, { status: 201 });
    }
    polls++;
    return Response.json(
      polls === 1 ? { ready: false, state: "inprogress", progress: 42 } : ready,
    );
  });
  class Tus {
    constructor(file, options) {
      assert.equal(file.type, "video/mp4");
      assert.equal(options.chunkSize % 262144, 0);
      assert.equal(options.uploadUrl, session.uploadUrl);
      assert.equal(options.storeFingerprintForResuming, false);
      this.o = options;
    }
    start() {
      uploads++;
      this.o.onProgress(file.size, file.size);
      this.o.onSuccess();
    }
    async abort() {}
  }
  const options = {
    owner: "user",
    signal: new AbortController().signal,
    onProgress: (p) => phases.push(p.phase),
    controls: () => {},
  };
  const first = await uploadStreamVideo(
    { file, altText: "Video", flags: ["test"] },
    options,
    { Upload: Tus, pollInterval: 0 },
  );
  assert.equal(first.url, url);
  assert.equal(first.filePath, `stream/${id}`);
  assert.equal(first.width, 1280);
  assert.deepEqual(first.flags, ["test"]);
  assert.ok(phases.includes("processing"));
  await uploadStreamVideo({ file }, options, { Upload: Tus, pollInterval: 0 });
  assert.equal(creates, 1);
  assert.equal(uploads, 1);
});
test("pause/resume controls stop tus, cancellation settles without publishing", async (t) => {
  setup(t, async () => Response.json(session, { status: 201 }));
  let controls,
    starts = 0,
    aborts = 0;
  const phases = [];
  class Tus {
    start() {
      starts++;
    }
    async abort() {
      aborts++;
    }
  }
  const controller = new AbortController();
  const promise = uploadStreamVideo(
    { file },
    {
      owner: "user",
      signal: controller.signal,
      onProgress: (p) => phases.push(p.phase),
      controls: (c) => {
        if (c) controls = c;
      },
    },
    { Upload: Tus },
  );
  while (!controls) await new Promise((r) => setTimeout(r, 1));
  await controls.pause();
  assert.ok(phases.includes("paused"));
  controls.resume();
  assert.equal(starts, 2);
  controller.abort();
  await assert.rejects(promise, { name: "AbortError" });
  assert.equal(aborts, 2);
  assert.ok(!phases.includes("ready"));
});
test("does not reuse another account upload or swallow status authorization errors", async (t) => {
  let creates = 0;
  setup(t, async (_url, options) => {
    if (options.method === "POST") {
      creates++;
      return Response.json(session, { status: 201 });
    }
    return Response.json(ready);
  });
  class Tus {
    constructor(_file, o) {
      this.o = o;
    }
    start() {
      this.o.onSuccess();
    }
    async abort() {}
  }
  const opts = (owner) => ({
    owner,
    signal: new AbortController().signal,
    onProgress: () => {},
    controls: () => {},
  });
  await uploadStreamVideo({ file }, opts("one"), { Upload: Tus });
  await uploadStreamVideo({ file }, opts("two"), { Upload: Tus });
  assert.equal(creates, 2);
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Sign in" }, { status: 401 }),
  );
  await assert.rejects(
    uploadStreamVideo({ file }, opts("one"), { Upload: Tus }),
    /Sign in/,
  );
});
test("processing failure keeps the post unpublished", async (t) => {
  setup(t, async (_url, o) =>
    o.method === "POST"
      ? Response.json(session, { status: 201 })
      : Response.json({ ready: false, failed: true, error: "Invalid video" }),
  );
  class Tus {
    constructor(_file, o) {
      this.o = o;
    }
    start() {
      this.o.onSuccess();
    }
    async abort() {}
  }
  await assert.rejects(
    uploadStreamVideo(
      { file },
      {
        owner: "user",
        signal: new AbortController().signal,
        onProgress: () => {},
        controls: () => {},
      },
      { Upload: Tus },
    ),
    /Invalid video/,
  );
});
test("polling cancellation interrupts the wait immediately", async () => {
  const controller = new AbortController();
  const waiting = waitForVideoPoll(60000, controller.signal);
  controller.abort();
  await assert.rejects(waiting, { name: "AbortError" });
});
test("retry after interrupted transfer reuses the same UID and upload capability", async (t) => {
  let creates = 0,
    attempts = 0;
  const seen = [];
  setup(t, async (_url, options) => {
    if (options.method === "POST") {
      creates++;
      return Response.json(session, { status: 201 });
    }
    return Response.json(
      attempts < 2
        ? { ready: false, state: "pendingupload", progress: 0 }
        : ready,
    );
  });
  class Tus {
    constructor(_file, o) {
      this.o = o;
      seen.push(o.uploadUrl);
    }
    start() {
      attempts++;
      if (attempts === 1) this.o.onError(new Error("network"));
      else this.o.onSuccess();
    }
    async abort() {}
  }
  const options = {
    owner: "user",
    signal: new AbortController().signal,
    onProgress: () => {},
    controls: () => {},
  };
  await assert.rejects(
    uploadStreamVideo({ file }, options, { Upload: Tus }),
    /resume/,
  );
  const media = await uploadStreamVideo({ file }, options, { Upload: Tus });
  assert.equal(media.fileId, id);
  assert.equal(creates, 1);
  assert.deepEqual(seen, [session.uploadUrl, session.uploadUrl]);
});
test("XHR timeout enters the tus error path instead of hanging", async (t) => {
  setup(t, async (_url, o) =>
    o.method === "POST"
      ? Response.json(session, { status: 201 })
      : Response.json(ready),
  );
  const old = Object.getOwnPropertyDescriptor(globalThis, "XMLHttpRequest");
  class XHR {}
  Object.defineProperty(globalThis, "XMLHttpRequest", {
    configurable: true,
    value: XHR,
  });
  t.after(() =>
    old
      ? Object.defineProperty(globalThis, "XMLHttpRequest", old)
      : delete globalThis.XMLHttpRequest,
  );
  let forwarded = false;
  class Tus {
    constructor(_file, o) {
      this.o = o;
    }
    start() {
      const xhr = new XHR();
      this.o.onBeforeRequest({ getUnderlyingObject: () => xhr });
      assert.equal(xhr.timeout, 300000);
      xhr.onerror = () => {
        forwarded = true;
      };
      xhr.ontimeout({ type: "timeout" });
      this.o.onSuccess();
    }
    async abort() {}
  }
  await uploadStreamVideo(
    { file },
    {
      owner: "user",
      signal: new AbortController().signal,
      onProgress: () => {},
      controls: () => {},
    },
    { Upload: Tus },
  );
  assert.equal(forwarded, true);
});

test("HTML errors show actionable diagnostics without exposing the response body", async (t) => {
  const { videoApi } = await import("../src/utils/stream-upload.ts");
  t.mock.method(console, "warn", () => {});
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.headers.Accept, "application/json");
    assert.equal(options.redirect, "manual");
    return new Response(
      "<!DOCTYPE html><html>private upstream details</html>",
      {
        status: 502,
        headers: { "content-type": "text/html", "cf-ray": "abc123-LHR" },
      },
    );
  });
  await assert.rejects(
    videoApi("/api/uploads/videos", new AbortController().signal, {}),
    (error) => {
      assert.match(error.message, /HTTP 502/);
      assert.match(error.message, /abc123-LHR/);
      assert.ok(!error.message.includes("private upstream"));
      assert.equal(error.invalidResponse, true);
      return true;
    },
  );
});
test("an HTML status outage recovers without uploading the video twice", async (t) => {
  let uploads = 0,
    polls = 0;
  t.mock.method(console, "warn", () => {});
  setup(t, async (_url, o) => {
    if (o.method === "POST") return Response.json(session, { status: 201 });
    if (++polls === 1)
      return new Response("<!DOCTYPE html>gateway timeout", {
        status: 504,
        headers: { "content-type": "text/html" },
      });
    return Response.json(ready);
  });
  class Tus {
    constructor(_file, o) {
      this.o = o;
    }
    start() {
      uploads++;
      this.o.onSuccess();
    }
    async abort() {}
  }
  const result = await uploadStreamVideo(
    { file },
    {
      owner: "user",
      signal: new AbortController().signal,
      onProgress: () => {},
      controls: () => {},
    },
    { Upload: Tus, pollInterval: 0 },
  );
  assert.equal(result.fileId, id);
  assert.equal(uploads, 1);
  assert.equal(polls, 2);
});
test("HTML 404 does not discard a cached upload or create duplicate videos", async (t) => {
  t.mock.method(console, "warn", () => {});
  setup(t, async (_url, o) =>
    o.method === "POST"
      ? Response.json(session, { status: 201 })
      : Response.json(ready),
  );
  class Tus {
    constructor(_file, o) {
      this.o = o;
    }
    start() {
      this.o.onSuccess();
    }
    async abort() {}
  }
  const options = {
    owner: "user",
    signal: new AbortController().signal,
    onProgress: () => {},
    controls: () => {},
  };
  await uploadStreamVideo({ file }, options, { Upload: Tus });
  let creates = 0;
  t.mock.method(globalThis, "fetch", async (_url, o) => {
    if (o.method === "POST") creates++;
    return new Response("<!DOCTYPE html>not found", {
      status: 404,
      headers: { "content-type": "text/html" },
    });
  });
  await assert.rejects(
    uploadStreamVideo({ file }, options, { Upload: Tus }),
    /HTTP 404/,
  );
  assert.equal(creates, 0);
});
test("redirects and Cloudflare challenges are reported instead of parsed as JSON", async (t) => {
  const { videoApi } = await import("../src/utils/stream-upload.ts");
  t.mock.method(console, "warn", () => {});
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(null, {
        status: 307,
        headers: { location: "/auth/signin" },
      }),
  );
  await assert.rejects(
    videoApi("/api/uploads/videos", new AbortController().signal, {}),
    /Sign in again/,
  );
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response("<html>challenge</html>", {
        status: 403,
        headers: { "content-type": "text/html", "cf-mitigated": "challenge" },
      }),
  );
  await assert.rejects(
    videoApi("/api/uploads/videos", new AbortController().signal, {}),
    /security challenge/,
  );
});
