import test from "node:test";
import assert from "node:assert/strict";
import { createVideoPlayback } from "../src/utils/video-playback-controller.ts";

const flush = () => new Promise((resolve) => setImmediate(resolve));
function fixture(autoPlay = true, playResult) {
  const calls = { play: 0, pause: 0 };
  const playback = createVideoPlayback(
    {
      play() {
        calls.play++;
        return playResult ?? Promise.resolve();
      },
      pause() {
        calls.pause++;
      },
    },
    autoPlay,
  );
  return { calls, playback };
}

test("manual pause survives visibility and readiness changes", async () => {
  const { playback, calls } = fixture();
  playback.update(true, true, true);
  await flush();
  playback.userPause();
  playback.update(true, true, true);
  playback.update(false, true, true);
  await flush();
  playback.update(true, true, true);
  playback.update(true, false, true);
  await flush();
  playback.update(true, true, false);
  playback.update(true, true, true);
  assert.equal(calls.play, 1);
});

test("finished video stays finished when revisiting it", async () => {
  const { playback, calls } = fixture();
  playback.update(true, true, true);
  await flush();
  playback.ended();
  playback.update(false, true, true);
  await flush();
  playback.update(true, true, true);
  assert.equal(calls.play, 1);
});

test("active video pauses offscreen and resumes when visible", async () => {
  const { playback, calls } = fixture();
  playback.update(true, true, true);
  await flush();
  playback.update(false, true, true);
  await flush();
  assert.equal(calls.pause, 1);
  playback.update(true, true, true);
  await flush();
  assert.equal(calls.play, 2);
});

test("autoplay disabled waits for manual play and preserves subsequent pause", async () => {
  const { playback, calls } = fixture(false);
  playback.update(true, true, true);
  assert.equal(calls.play, 0);
  playback.userPlay(); // The player handles the control's play request itself.
  playback.update(true, false, true);
  await flush();
  playback.update(true, true, true);
  await flush();
  assert.equal(calls.play, 1);
  playback.userPause();
  playback.update(false, true, true);
  await flush();
  playback.update(true, true, true);
  assert.equal(calls.play, 1);
});

test("pending autoplay cannot override a later manual pause", async () => {
  let resolve;
  const { playback, calls } = fixture(
    true,
    new Promise((r) => {
      resolve = r;
    }),
  );
  playback.update(true, true, true);
  playback.userPause();
  resolve();
  await flush();
  assert.equal(calls.pause, 1);
});

test("no playback until visible and ready; rejected play does not retry in a loop", async () => {
  const { playback, calls } = fixture(
    true,
    Promise.reject(new Error("Autoplay denied")),
  );
  playback.update(false, true, true);
  playback.update(true, false, true);
  playback.update(true, true, false);
  assert.equal(calls.play, 0);
  playback.update(true, true, true);
  await flush();
  playback.update(true, true, true);
  assert.equal(calls.play, 1);
});

test("disposed controller cannot pause a replacement player after a slow play", async () => {
  let resolve;
  const { playback, calls } = fixture(
    true,
    new Promise((r) => {
      resolve = r;
    }),
  );
  playback.update(true, true, true);
  playback.dispose();
  playback.userPause();
  resolve();
  await flush();
  assert.equal(calls.pause, 0);
});
