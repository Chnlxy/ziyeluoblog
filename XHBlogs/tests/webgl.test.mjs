import assert from "node:assert/strict";
import test from "node:test";

import { detectWebglSupport } from "../lib/webgl.ts";

test("detects WebGL once and releases the temporary context", () => {
  let loseContextCalls = 0;
  const context = {
    getExtension(name) {
      assert.equal(name, "WEBGL_lose_context");
      return {
        loseContext() {
          loseContextCalls += 1;
        },
      };
    },
  };
  const canvas = {
    getContext(type) {
      assert.ok(type === "webgl2" || type === "webgl");
      return context;
    },
  };

  assert.equal(detectWebglSupport(() => canvas), true);
  assert.equal(loseContextCalls, 1);
});

test("returns false when canvas or WebGL creation throws", () => {
  assert.equal(
    detectWebglSupport(() => {
      throw new Error("canvas unavailable");
    }),
    false,
  );
  assert.equal(
    detectWebglSupport(() => ({
      getContext() {
        return null;
      },
    })),
    false,
  );
});
