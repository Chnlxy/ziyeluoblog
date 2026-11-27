import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { onRequestPost } from "../functions/api/guestbook.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("does not expose D1 errors to public guestbook visitors", async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  globalThis.fetch = async () => Response.json({ success: true });
  const db = {
    prepare(query) {
      return {
        bind() {
          return this;
        },
        async first() {
          return { minute_count: 0, hour_count: 0 };
        },
        async run() {
          if (query.includes("INSERT INTO guestbook_messages")) {
            throw new Error("D1 internal database detail");
          }
          return { success: true };
        },
      };
    },
  };
  const request = new Request("https://wakaba.cc/api/guestbook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "CF-Connecting-IP": "203.0.113.11",
    },
    body: JSON.stringify({
      nickname: "阿叶",
      content: "测试留言",
      turnstileToken: "turnstile-token",
    }),
  });

  try {
    const response = await onRequestPost({
      request,
      env: {
        GUESTBOOK_DB: db,
        TURNSTILE_SECRET_KEY: "turnstile-secret",
        RATE_LIMIT_SECRET: "rate-secret",
      },
    });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "留言提交失败" });
  } finally {
    console.error = originalConsoleError;
  }
});
