import assert from "node:assert/strict";
import test from "node:test";

import {
  ADMIN_COOKIE,
  createAdminSession,
  hmacSha256Hex,
  loginIsLocked,
  requireAdminSession,
  secureEqualHex,
  sha256Hex,
  verifyAdminSession,
} from "../functions/_lib/admin-auth.mjs";

test("hashes the admin password without exposing it", async () => {
  assert.equal(
    await sha256Hex("correct horse battery staple"),
    "c4bbcb1fbec99d65bf59d85c8cb62ee2db963f0fe106f483d9afa73bd4e39a8a",
  );
});

test("compares password digests in constant-time form", () => {
  assert.equal(secureEqualHex("abcd", "abcd"), true);
  assert.equal(secureEqualHex("abcd", "abce"), false);
  assert.equal(secureEqualHex("abcd", "abc"), false);
});

test("derives a stable hexadecimal rate-limit key", async () => {
  assert.equal(
    await hmacSha256Hex("visitor", "secret"),
    "b72edf69b36eba648e5d98e85e242c3225689cd15b7994f33e4f830ab73eb63e",
  );
});

test("creates a session that survives an unchanged round trip", async () => {
  const now = 1_800_000_000_000;
  const token = await createAdminSession("session-secret", now);
  assert.equal(
    await verifyAdminSession(token, "session-secret", now + 60_000),
    true,
  );
});

test("rejects tampered and expired sessions", async () => {
  const now = 1_800_000_000_000;
  const token = await createAdminSession("session-secret", now);
  assert.equal(
    await verifyAdminSession(`${token}x`, "session-secret", now + 60_000),
    false,
  );
  assert.equal(
    await verifyAdminSession(token, "wrong-secret", now + 60_000),
    false,
  );
  assert.equal(
    await verifyAdminSession(token, "session-secret", now + 43_200_001),
    false,
  );
});

test("locks login after five failures in the active window", () => {
  assert.equal(loginIsLocked(4), false);
  assert.equal(loginIsLocked(5), true);
});

test("requires a valid admin session cookie", async () => {
  const env = { ADMIN_SESSION_SECRET: "session-secret" };
  await assert.rejects(
    () =>
      requireAdminSession(
        new Request("https://wakaba.cc/api/admin/guestbook"),
        env,
      ),
    (error) => error instanceof Error && error.status === 401,
  );

  const token = await createAdminSession("session-secret");
  const request = new Request("https://wakaba.cc/api/admin/guestbook", {
    headers: { cookie: `theme=dark; ${ADMIN_COOKIE}=${token}` },
  });
  assert.deepEqual(await requireAdminSession(request, env), {
    authenticated: true,
    subject: "guestbook-admin",
  });
});
