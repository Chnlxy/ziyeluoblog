# Moment Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors open each moment at its own static URL while keeping image clicks inside the existing image lightbox.

**Architecture:** Add a statically generated `/moments/[id]/` route backed by the existing Markdown moment files. Extract the image lightbox into a shared client component so the list and detail pages use identical image behavior. Add a keyboard-accessible overlay link to each moment card.

**Tech Stack:** Next.js 16 static export, React 19, TypeScript, Tailwind CSS 4, Node test runner

**Spec:** User approved independent moment detail pages on 2026-11-27. Current cards are non-interactive unless a photo is clicked.

## Global Constraints

- Every Markdown file in `XHBlogs/moments` must have a generated detail page.
- Clicking the card opens `/moments/<id>/`.
- Clicking an image continues to open the lightbox instead of navigating.
- Detail pages must work with GitHub Pages static export.
- Unknown moment IDs must resolve through the generated-site 404 behavior.

---

### Task 1: Share Moment Image Lightbox and Expose Single-Moment Data

**Files:**
- Create: `XHBlogs/components/MomentImageLightbox.tsx`
- Modify: `XHBlogs/app/moments/MomentList.tsx`
- Modify: `XHBlogs/lib/content.ts`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Produces: `getMoment(id: string): MomentSummary | null`
- Produces: `<MomentImageLightbox images={string[]} index={number} onClose={() => void} onChange={(index: number) => void} />`
- Consumes: Existing `MomentSummary` type.

- [ ] **Step 1: Write the failing test**

```js
test("provides a safe single-moment lookup and shared image lightbox", () => {
  const content = fs.readFileSync(
    path.join(root, "lib", "content.ts"),
    "utf8",
  );
  const lightboxPath = path.join(
    root,
    "components",
    "MomentImageLightbox.tsx",
  );

  assert.match(content, /export function getMoment\(id: string\)/);
  assert.match(content, /getMoments\(\)\.find\(\(moment\) => moment\.id === id\)/);
  assert.ok(fs.existsSync(lightboxPath));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="safe single-moment lookup" tests/ziyeluo-config.test.mjs`

Expected: FAIL because `getMoment` and the shared lightbox do not exist.

- [ ] **Step 3: Implement the shared lightbox and lookup**

Move the existing lightbox markup and navigation controls into `MomentImageLightbox.tsx`. Change `MomentList` to keep only its lightbox state and render the shared component. Add:

```ts
export function getMoment(id: string): MomentSummary | null {
  return getMoments().find((moment) => moment.id === id) ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="safe single-moment lookup" tests/ziyeluo-config.test.mjs`

Expected: PASS.

### Task 2: Generate Detail Pages and Link Every Moment Card

**Files:**
- Create: `XHBlogs/app/moments/[id]/page.tsx`
- Modify: `XHBlogs/app/moments/MomentList.tsx`
- Test: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: `getMoments()` and `getMoment(id)`.
- Produces: Static routes `/moments/<id>/` and keyboard-accessible card links.

- [ ] **Step 1: Write the failing static-route test**

```js
test("generates a static detail page for every moment", () => {
  const routePath = path.join(root, "app", "moments", "[id]", "page.tsx");
  const list = fs.readFileSync(
    path.join(root, "app", "moments", "MomentList.tsx"),
    "utf8",
  );

  assert.ok(fs.existsSync(routePath));
  const route = fs.readFileSync(routePath, "utf8");
  assert.match(route, /generateStaticParams/);
  assert.match(route, /getMoment\(resolvedParams\.id\)/);
  assert.match(route, /href=\{`\/moments\/\$\{moment\.id\}\/`\}/);
  assert.match(list, /absolute inset-0 z-10/);
  assert.match(list, /relative z-20/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="static detail page for every moment" tests/ziyeluo-config.test.mjs`

Expected: FAIL because the dynamic route and card overlay do not exist.

- [ ] **Step 3: Implement detail routing and card navigation**

Create the route with:

```tsx
export function generateStaticParams() {
  return getMoments().map((moment) => ({ id: moment.id }));
}

export default async function MomentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const moment = getMoment(resolvedParams.id);
  if (!moment) notFound();
  return <MomentDetail moment={moment} />;
}
```

In each list card, add an overlay link:

```tsx
<Link
  href={`/moments/${moment.id}/`}
  aria-label={`查看 ${formatContentDate(moment.date)} 的说说`}
  className="absolute inset-0 z-10 rounded-[inherit] focus:outline-none focus:ring-2 focus:ring-indigo-300"
/>
```

Give the image buttons `relative z-20` so they remain clickable above the overlay link.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="static detail page for every moment" tests/ziyeluo-config.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected: 28 tests pass, TypeScript exits 0, and `/moments/<id>/` routes appear in the static export.

- [ ] **Step 6: Browser verification**

Open `/moments/`, click the body of a card, confirm the URL becomes `/moments/<id>/`, then return and click a moment image and confirm it opens the lightbox without navigating.

- [ ] **Step 7: Commit and deploy**

```powershell
git add XHBlogs/app/moments XHBlogs/components/MomentImageLightbox.tsx XHBlogs/lib/content.ts XHBlogs/tests/ziyeluo-config.test.mjs docs/superpowers/plans/2026-11-27-moment-detail-pages.md
git commit -m "feat: add moment detail pages"
```

Deploy through the existing GitHub API workflow and verify the GitHub Pages deployment succeeds.
