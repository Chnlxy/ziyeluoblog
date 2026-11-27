import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeGuestbookInput,
  publicMessage,
  validateModerationStatus,
} from "../functions/_lib/guestbook-core.mjs";

test("normalizes an anonymous guestbook message", () => {
  assert.deepEqual(
    normalizeGuestbookInput({
      nickname: "  阿叶  ",
      website: "  https://example.com  ",
      content: "  第一行\r\n\r\n第二行  ",
    }),
    {
      nickname: "阿叶",
      website: "https://example.com/",
      content: "第一行\n\n第二行",
    },
  );
});

test("rejects empty, oversized and HTML guestbook messages", () => {
  assert.throws(
    () =>
      normalizeGuestbookInput({
        nickname: " ",
        content: "hello",
      }),
    /昵称/,
  );
  assert.throws(
    () =>
      normalizeGuestbookInput({
        nickname: "阿叶",
        content: " ",
      }),
    /留言内容/,
  );
  assert.throws(
    () =>
      normalizeGuestbookInput({
        nickname: "阿叶",
        content: "x".repeat(1001),
      }),
    /1000/,
  );
  assert.throws(
    () =>
      normalizeGuestbookInput({
        nickname: "阿叶",
        content: "<script>alert(1)</script>",
      }),
    /HTML/,
  );
});

test("rejects non-http guestbook websites", () => {
  assert.throws(
    () =>
      normalizeGuestbookInput({
        nickname: "阿叶",
        website: "javascript:alert(1)",
        content: "你好",
      }),
    /HTTP/,
  );
});

test("rejects websites longer than 500 characters", () => {
  assert.throws(
    () =>
      normalizeGuestbookInput({
        nickname: "阿叶",
        website: `https://example.com/${"a".repeat(500)}`,
        content: "你好",
      }),
    /500/,
  );
});

test("accepts only defined moderation statuses", () => {
  assert.equal(validateModerationStatus("approved"), "approved");
  assert.equal(validateModerationStatus("hidden"), "hidden");
  assert.equal(validateModerationStatus("pending"), "pending");
  assert.throws(() => validateModerationStatus("deleted"), /状态/);
});

test("maps a public D1 row without leaking the rate key", () => {
  assert.deepEqual(
    publicMessage({
      id: "message-1",
      nickname: "阿叶",
      website: null,
      content: "你好",
      created_at: "2026-11-27T12:00:00.000Z",
      rate_key: "secret",
    }),
    {
      id: "message-1",
      nickname: "阿叶",
      website: "",
      content: "你好",
      createdAt: "2026-11-27T12:00:00.000Z",
    },
  );
});
