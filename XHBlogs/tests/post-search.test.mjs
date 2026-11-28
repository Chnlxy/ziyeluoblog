import assert from "node:assert/strict";
import test from "node:test";

import { filterPosts } from "../lib/postSearch.ts";

const posts = [
  {
    slug: "algorithm",
    title: "ACM 入门",
    description: "从基础数据结构开始",
    tags: ["算法", "题解"],
  },
  {
    slug: "travel",
    title: "日本旅行",
    description: "从东京走到大阪",
    tags: ["旅行", "摄影"],
  },
];

test("returns every post for an empty query", () => {
  assert.deepEqual(filterPosts(posts, "  "), posts);
});

test("matches titles, descriptions, and tags case-insensitively", () => {
  assert.deepEqual(
    filterPosts(posts, "acm").map((post) => post.slug),
    ["algorithm"],
  );
  assert.deepEqual(
    filterPosts(posts, "数据结构").map((post) => post.slug),
    ["algorithm"],
  );
  assert.deepEqual(
    filterPosts(posts, "摄影").map((post) => post.slug),
    ["travel"],
  );
});

test("returns no posts when nothing matches", () => {
  assert.deepEqual(filterPosts(posts, "不存在"), []);
});
