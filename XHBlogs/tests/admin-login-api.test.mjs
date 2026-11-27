import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { sha256Hex } from "../functions/_lib/admin-auth.mjs";
import { onRequestPost } from "../functions/api/admin/login.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

class LoginDb {
  rows = [];

  prepare(query) {
    const db = this;
    let values = [];
    return {
      bind(...nextValues) {
        values = nextValues;
        return this;
      },
      async first() {
        if (!query.includes("COUNT(*)")) return null;
        const [rateKey, cutoff] = values;
        return {
          failure_count: db.rows.filter(
            (row) => row.rate_key === rateKey && row.failed_at >= cutoff,
          ).length,
        };
      },
      async run() {
        if (query.includes("INSERT INTO admin_login_failures")) {
          const [id, rateKey, failedAt] = values;
          db.rows.push({ id, rate_key: rateKey, failed_at: failedAt });
        } else if (query.includes("failed_at < ?")) {
          const [cutoff] = values;
          db.rows = db.rows.filter((row) => row.failed_at >= cutoff);
        } else if (query.includes("failed_at >= ?")) {
          const [rateKey, cutoff] = values;
          db.rows = db.rows.filter(
            (row) =>
              row.rate_key !== rateKey || row.failed_at < cutoff,
          );
        }
        return { success: true };
      },
    };
  }
}

async function makeEnv(db) {
  return {
    GUESTBOOK_DB: db,
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    RATE_LIMIT_SECRET: "rate-secret",
    ADMIN_PASSWORD_HASH: await sha256Hex("correct admin password"),
    ADMIN_SESSION_SECRET: "session-secret",
  };
}

function loginRequest(password, token = "turnstile-token") {
  return new Request("https://wakaba.cc/api/admin/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "CF-Connecting-IP": "203.0.113.10",
    },
    body: JSON.stringify({ password, turnstileToken: token }),
  });
}

test("rejects a missing Turnstile token before recording a password failure", async () => {
  const db = new LoginDb();
  const env = await makeEnv(db);
  globalThis.fetch = async () => {
    throw new Error("Turnstile must not be called without a token");
  };

  const response = await onRequestPost({
    request: loginRequest("wrong", ""),
    env,
  });

  assert.equal(response.status, 400);
  assert.equal(db.rows.length, 0);
});

test("locks password login after five failed attempts", async () => {
  const db = new LoginDb();
  const env = await makeEnv(db);
  let turnstileCalls = 0;
  globalThis.fetch = async () => {
    turnstileCalls += 1;
    return Response.json({ success: true });
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await onRequestPost({
      request: loginRequest("wrong"),
      env,
    });
    assert.equal(response.status, 401);
  }

  const locked = await onRequestPost({
    request: loginRequest("wrong"),
    env,
  });

  assert.equal(locked.status, 429);
  assert.equal(turnstileCalls, 5);
  assert.equal(db.rows.length, 5);
});

test("successful login clears recent failures and sets a secure cookie", async () => {
  const db = new LoginDb();
  const env = await makeEnv(db);
  globalThis.fetch = async () => Response.json({ success: true });

  await onRequestPost({
    request: loginRequest("wrong"),
    env,
  });
  const response = await onRequestPost({
    request: loginRequest("correct admin password"),
    env,
  });

  assert.equal(response.status, 200);
  assert.equal(db.rows.length, 0);
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
});
