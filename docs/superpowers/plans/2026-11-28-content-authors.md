# Content Author Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display Codex-authored archive content as “哦鲸鲸” with a local Codex avatar while keeping user-authored content under “梓叶落”.

**Architecture:** Define named content-author profiles, store an author ID in each post/moment front matter, and resolve it into name/avatar/bio when parsing content. Post detail and moment list/detail then render the author belonging to that content item.

**Tech Stack:** Next.js, TypeScript, gray-matter, SVG asset, Node test runner

**Spec:** User approved two identities: user-authored content uses 梓叶落 and the existing avatar; AI-generated/archive content uses 哦鲸鲸 and a local Codex `>_` avatar.

## Global Constraints

- Existing three posts other than 《故事的开始》 use `author: "codex"`.
- Existing five moments use `author: "codex"`.
- 《故事的开始》 uses `author: "ziyeluo"`.
- Missing or unknown author IDs fall back to `ziyeluo`.
- Future AI summary content uses `author: "codex"`; user-authored content uses `author: "ziyeluo"`.
- No remote avatar dependency.

---

### Task 1: Add per-content author profiles and rendering

**Files:**

- Create: `XHBlogs/data/authors.ts`
- Create: `XHBlogs/public/images/avatars/codex.svg`
- Modify: `XHBlogs/lib/content-types.ts`
- Modify: `XHBlogs/lib/content.ts`
- Modify: `XHBlogs/app/posts/[slug]/page.tsx`
- Modify: `XHBlogs/app/moments/page.tsx`
- Modify: `XHBlogs/app/moments/MomentList.tsx`
- Modify: `XHBlogs/app/moments/[id]/page.tsx`
- Modify: `XHBlogs/app/moments/[id]/MomentDetail.tsx`
- Modify: all existing `XHBlogs/posts/*.md` and `XHBlogs/moments/*.md`
- Test: `XHBlogs/tests/content-author.test.mjs`

- [ ] **Step 1: Write failing author tests**

```javascript
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
```

- [ ] **Step 2: Run the tests and confirm failure**

Expected: FAIL because author profiles and parsed author fields do not exist.

- [ ] **Step 3: Implement author profiles and content parsing**

Create `contentAuthors.ziyeluo` and `contentAuthors.codex`, with local names, avatars, and bios. Add `author` to `PostSummary` and `MomentSummary`; parse front matter through `resolveContentAuthor`.

- [ ] **Step 4: Update content front matter**

Add `author: "codex"` to the three archive posts and all five moments. Add `author: "ziyeluo"` to `the-beginning.md`.

- [ ] **Step 5: Render each content item’s own author**

Post detail uses `postData.author`. Moments list/detail use `moment.author` and no longer accept global author props.

- [ ] **Step 6: Verify and commit**

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
git add XHBlogs/data/authors.ts XHBlogs/public/images/avatars/codex.svg XHBlogs/lib XHBlogs/app/posts XHBlogs/app/moments XHBlogs/posts XHBlogs/moments XHBlogs/tests/content-author.test.mjs docs/superpowers/plans/2026-11-28-content-authors.md
git commit -m "feat: separate content author identities"
```

Then verify 《故事的开始》 shows 梓叶落 while an archive post and a moment show 哦鲸鲸.
