import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { resolveContentAuthor } from "../data/authors.ts";
import { getMoments, getPosts } from "../lib/content.ts";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test("routes archive content to Codex and user articles to Ziyeluo", () => {
  const posts = getPosts();
  const moments = getMoments();

  assert.equal(
    posts.find((post) => post.slug === "the-beginning").author.name,
    "梓叶落",
  );
  for (const slug of [
    "a-quiet-place",
    "reading-and-writing",
    "welcome-to-fantasy",
  ]) {
    const author = posts.find((post) => post.slug === slug).author;
    assert.equal(author.name, "哦鲸鲸");
    assert.equal(author.avatarUrl, "/images/avatars/codex.svg");
  }
  assert.ok(moments.every((moment) => moment.author.name === "哦鲸鲸"));
});

test("falls back to Ziyeluo for missing or unknown authors", () => {
  assert.equal(resolveContentAuthor(undefined).name, "梓叶落");
  assert.equal(resolveContentAuthor("unknown").name, "梓叶落");
});

test("content surfaces render the author stored on each item", () => {
  const postPage = fs.readFileSync(
    path.join(root, "app", "posts", "[slug]", "page.tsx"),
    "utf8",
  );
  const momentList = fs.readFileSync(
    path.join(root, "app", "moments", "MomentList.tsx"),
    "utf8",
  );
  const momentDetail = fs.readFileSync(
    path.join(root, "app", "moments", "[id]", "MomentDetail.tsx"),
    "utf8",
  );

  assert.match(postPage, /postData\.author\.avatarUrl/);
  assert.match(postPage, /postData\.author\.name/);
  assert.match(momentList, /moment\.author\.avatarUrl/);
  assert.match(momentList, /moment\.author\.name/);
  assert.match(momentDetail, /moment\.author\.avatarUrl/);
  assert.match(momentDetail, /moment\.author\.name/);
});
