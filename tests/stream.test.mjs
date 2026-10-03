import test from "node:test";
import assert from "node:assert/strict";
import {
  createStreamService,
  createStreamHandlers,
  creatorId,
  validateVideo,
  MAX_VIDEO_BYTES,
} from "../src/lib/storage/stream.ts";
import { videoPlayback } from "../src/utils/video-playback.ts";
const id = "a".repeat(32);
const config = {
  accountId: "b".repeat(32),
  token: "server-secret",
  appUrl: "https://kwonnet.com",
  maxDuration: 600,
};
const file = { name: "my video.mp4", size: 12000000, type: "video/mp4" };
const uploadUrl = `https://upload.videodelivery.net/tus/${id}?token=capability`;
const ready = {
  uid: id,
  creator: creatorId("user-1"),
  readyToStream: true,
  status: { state: "ready", pctComplete: "100" },
  playback: {
    hls: `https://customer-example.cloudflarestream.com/${id}/manifest/video.m3u8`,
  },
  thumbnail: `https://customer-example.cloudflarestream.com/${id}/thumbnails/thumbnail.jpg`,
  input: { width: 1920, height: 1080 },
};
const request = (body = file, origin = "https://kwonnet.com") =>
  new Request("https://kwonnet.com/api/uploads/videos", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
test("provisions direct tus upload with server-controlled constraints and ownership", async () => {
  const service = createStreamService(config, async (url, options) => {
    assert.equal(
      url,
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/stream?direct_user=true`,
    );
    assert.equal(options.headers.Authorization, "Bearer server-secret");
    assert.equal(options.headers["Upload-Length"], String(file.size));
    assert.equal(options.headers["Tus-Resumable"], "1.0.0");
    assert.equal(options.headers["Upload-Creator"], creatorId("user-1"));
    const metadata = Object.fromEntries(
      options.headers["Upload-Metadata"].split(",").map((pair) => {
        const [k, v] = pair.split(" ");
        return [k, Buffer.from(v, "base64").toString()];
      }),
    );
    assert.equal(metadata.maxDurationSeconds, "600");
    assert.equal(metadata.allowedorigins, "kwonnet.com");
    assert.equal(metadata.filename, file.name);
    assert.ok(Date.parse(metadata.expiry) > Date.now());
    return new Response(null, {
      status: 201,
      headers: { Location: uploadUrl, "stream-media-id": id },
    });
  });
  const session = await service.create("user-1", {
    ...file,
    creator: "attacker",
    maxDurationSeconds: 99999,
  });
  assert.equal(session.id, id);
  assert.equal(session.uploadUrl, uploadUrl);
  assert.equal(session.maxDurationSeconds, 600);
  assert.ok(!JSON.stringify(session).includes(config.token));
});
test("rejects unsupported, empty, oversized, invalid metadata before reserving storage", () => {
  for (const f of [
    { ...file, size: 0 },
    { ...file, size: MAX_VIDEO_BYTES + 1 },
    { ...file, size: 1.5 },
    { ...file, type: "text/html" },
    { ...file, name: "bad\nname" },
    null,
  ])
    assert.throws(() => validateVideo(f));
});
test("requires matching origin and a signed-in session before Cloudflare requests", async () => {
  let calls = 0;
  const deps = {
    config: () => config,
    userId: async () => undefined,
    fetcher: async () => {
      calls++;
      throw new Error("must not call");
    },
    reserve: () => {
      calls++;
    },
  };
  assert.equal((await createStreamHandlers(deps).POST(request())).status, 401);
  assert.equal(
    (
      await createStreamHandlers({
        ...deps,
        userId: async () => "user-1",
      }).POST(request(file, "https://evil.com"))
    ).status,
    403,
  );
  assert.equal(
    (
      await createStreamHandlers(deps).GET(
        new Request("https://kwonnet.com"),
        id,
      )
    ).status,
    401,
  );
  assert.equal(calls, 0);
});
test("bounds JSON bodies and returns safe upstream errors without secrets", async () => {
  const handlers = createStreamHandlers({
    config: () => config,
    userId: async () => "user-1",
    reserve: () => {},
    fetcher: async () => {
      throw new Error(config.token);
    },
  });
  assert.equal(
    (await handlers.POST(request({ name: "x".repeat(5000) }))).status,
    413,
  );
  const result = await handlers.POST(request());
  assert.equal(result.status, 502);
  assert.ok(!(await result.text()).includes(config.token));
});
test("only returns playable metadata to the owning user and never returns provider secrets", async () => {
  const service = createStreamService(config, async () =>
    Response.json({
      success: true,
      result: { ...ready, secret: "never-return" },
    }),
  );
  const status = await service.status("user-1", id);
  assert.equal(status.ready, true);
  assert.equal(status.width, 1920);
  assert.equal(status.url, ready.playback.hls);
  assert.equal(status.secret, undefined);
  await assert.rejects(service.status("other-user", id), { status: 404 });
  await assert.rejects(service.status("user-1", "../arbitrary"), {
    status: 404,
  });
});
test("processing and error states cannot be published as ready", async () => {
  for (const result of [
    {
      ...ready,
      readyToStream: false,
      status: { state: "inprogress", pctComplete: "39" },
    },
    { ...ready, status: { state: "error" } },
    { ...ready, playback: { hls: "https://evil.com/video.m3u8" } },
    { ...ready, input: { width: 0, height: 0 } },
  ]) {
    const status = await createStreamService(config, async () =>
      Response.json({ success: true, result }),
    ).status("user-1", id);
    assert.equal(status.ready, false);
    assert.equal(status.url, undefined);
  }
});
test("rejects missing UID and arbitrary upstream upload destinations", async () => {
  for (const headers of [
    { Location: uploadUrl },
    { Location: "https://evil.com/tus", "stream-media-id": id },
  ])
    await assert.rejects(
      createStreamService(
        config,
        async () => new Response(null, { status: 201, headers }),
      ).create("user-1", file),
      { status: 502 },
    );
});
test("Cloudflare playback uses stored HLS and thumbnail URLs", () => {
  const media = videoPlayback({
    videoId: id,
    thumbnail: ready.thumbnail,
    url: ready.playback.hls,
  });
  assert.equal(media.hlsUrl, ready.playback.hls);
  assert.equal(media.poster, ready.thumbnail);
  assert.equal(media.previewUrl, ready.thumbnail);
});
test("Cloudflare playback constructs missing URLs from the Stream UID", () => {
  const media = videoPlayback({ videoId: id, thumbnail: "" });
  assert.equal(
    media.hlsUrl,
    `https://videodelivery.net/${id}/manifest/video.m3u8`,
  );
  assert.equal(
    media.poster,
    `https://videodelivery.net/${id}/thumbnails/thumbnail.jpg`,
  );
  assert.equal(media.previewUrl, media.poster);
});
test("bounds new upload reservations per authenticated user", async () => {
  let created = 0;
  const handlers = createStreamHandlers({
    config: () => config,
    userId: async () => "quota-test-user",
    fetcher: async () => {
      created++;
      return new Response(null, {
        status: 201,
        headers: { Location: uploadUrl, "stream-media-id": id },
      });
    },
  });
  for (let i = 0; i < 10; i++)
    assert.equal((await handlers.POST(request())).status, 201);
  assert.equal((await handlers.POST(request())).status, 429);
  assert.equal(created, 10);
});

test("provider authorization failures report a safe configuration error with diagnostic codes", async (t) => {
  const logs = [];
  t.mock.method(console, "error", (value) => logs.push(JSON.parse(value)));
  const service = createStreamService(config, async () =>
    Response.json(
      { errors: [{ code: 10000, message: "SECRET API TOKEN" }] },
      { status: 403 },
    ),
  );
  await assert.rejects(service.create("user-1", file), (error) => {
    assert.equal(error.status, 503);
    assert.match(error.message, /authorization failed/);
    assert.ok(!error.message.includes("SECRET"));
    return true;
  });
  assert.equal(logs[0].providerStatus, 403);
  assert.deepEqual(logs[0].providerCodes, [10000]);
  assert.ok(!JSON.stringify(logs).includes("SECRET"));
});
test("provider HTML failure is logged safely without parsing or exposing its body", async (t) => {
  const logs = [];
  t.mock.method(console, "error", (value) => logs.push(JSON.parse(value)));
  const service = createStreamService(
    config,
    async () =>
      new Response("<!DOCTYPE html>private diagnostics", {
        status: 502,
        headers: { "content-type": "text/html" },
      }),
  );
  await assert.rejects(service.create("user-1", file), { status: 502 });
  assert.equal(logs[0].operation, "create");
  assert.equal(logs[0].providerStatus, 502);
  assert.ok(!JSON.stringify(logs).includes("private diagnostics"));
});
