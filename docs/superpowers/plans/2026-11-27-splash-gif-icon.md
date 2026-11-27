# Splash GIF Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the splash-screen avatar with the supplied animated praying-girl GIF while preserving the current loading animation.

**Architecture:** Store a web-sized, still-animated copy of the supplied GIF in `public/images`, expose its URL through `siteConfig`, and render it through the existing splash medallion with pixel-preserving scaling.

**Tech Stack:** Next.js 16, React 19, Pillow 12, Node test runner

**Spec:** User-supplied 80-frame, 366×365 GIF on 2026-11-27 with the instruction “把加载时的梓叶落图标换成这个gif”.

## Global Constraints

- Keep the GIF animated.
- Preserve transparency and the 80 source frames.
- Produce a 192×192 web asset to reduce the 1.38 MB source download.
- Show the full image without circular cropping.
- Keep “少女祈祷中…” and the existing ring/progress-bar animation.

---

### Task 1: Publish and Render the Splash GIF

**Files:**
- Create: `XHBlogs/public/images/splash-praying-girl.gif`
- Modify: `XHBlogs/siteConfig.ts`
- Modify: `XHBlogs/components/SplashScreen.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Produces: `siteConfig.splashImageUrl`
- Consumes: Existing splash medallion markup.

- [ ] **Step 1: Write the failing test**

```js
test("uses the animated praying-girl GIF on the splash screen", () => {
  const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");
  const splash = fs.readFileSync(
    path.join(root, "components", "SplashScreen.tsx"),
    "utf8",
  );
  const asset = path.join(
    root,
    "public",
    "images",
    "splash-praying-girl.gif",
  );

  assert.match(
    config,
    /splashImageUrl:\s*"\/images\/splash-praying-girl\.gif"/,
  );
  assert.ok(fs.existsSync(asset));
  assert.match(splash, /siteConfig\.splashImageUrl/);
  assert.match(splash, /object-contain/);
  assert.match(splash, /pixelated/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="animated praying-girl GIF" tests/ziyeluo-config.test.mjs`

Expected: FAIL because the asset and configuration do not exist.

- [ ] **Step 3: Create the optimized animated asset**

Use Pillow to resize every frame to 192×192, preserve duration/loop metadata, and write the optimized GIF to:

`XHBlogs/public/images/splash-praying-girl.gif`

- [ ] **Step 4: Implement the configuration and image**

```ts
splashImageUrl: "/images/splash-praying-girl.gif",
```

```tsx
<img
  src={siteConfig.splashImageUrl}
  alt=""
  fetchPriority="high"
  className="h-full w-full rounded-full object-contain [image-rendering:pixelated]"
/>
```

Increase the medallion to `h-32 w-32` so the animated character remains recognizable.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test --test-name-pattern="animated praying-girl GIF" tests/ziyeluo-config.test.mjs`

Expected: PASS.

- [ ] **Step 6: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: 33 tests pass, TypeScript exits 0, and the static export builds successfully.

- [ ] **Step 7: Browser verification**

Reload the homepage, confirm the splash image request resolves to the GIF, and sample two animation frames to ensure the image is animated and not cropped.

- [ ] **Step 8: Commit and deploy**

```powershell
git add XHBlogs/public/images/splash-praying-girl.gif XHBlogs/siteConfig.ts XHBlogs/components/SplashScreen.tsx XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-splash-gif-icon.md
git commit -m "feat: use animated splash artwork"
```

Deploy through the existing GitHub API workflow and verify GitHub Pages succeeds.
