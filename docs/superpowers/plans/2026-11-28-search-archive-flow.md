# Homepage Search and Archive Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the homepage search into a compact accessible quick-search and connect it to a full searchable archive.

**Architecture:** Extract pure post filtering, reuse it in the homepage dropdown and archive view, and keep all filtering client-side for static export compatibility.

**Tech Stack:** Next.js App Router, React, TypeScript, Framer Motion, Node test runner

**Spec:** Approved conversation design: compact homepage search, keyboard support, archive query routing, and complete archive filtering.

## Global Constraints

- Homepage search remains visible.
- Homepage input width is compact and capped at roughly `28rem`.
- Search matches title, description, and tags case-insensitively.
- Homepage results show at most six articles and link to the full archive result.
- Pressing Enter with no active result navigates to `/timeline?q=...`.
- Escape closes results; arrow keys move through results.
- Static export compatibility is mandatory.
- Archive search reads `q` from the URL and filters all posts.
- Full tests, TypeScript, production build, browser verification, review, and deployment are required.

---

### Task 1: Extract pure post filtering

**Files:**
- Create: `XHBlogs/lib/postSearch.ts`
- Create: `XHBlogs/tests/post-search.test.mjs`

**Interfaces:**
- Produces: `filterPosts(posts, query): PostSummary[]`

- [x] **Step 1: Write failing tests for title, description, tag, case-insensitive, and empty-query matching.**
- [x] **Step 2: Run `node --test tests/post-search.test.mjs` and confirm failure.**
- [x] **Step 3: Implement trim/lowercase filtering across title, description, and tags.**
- [x] **Step 4: Re-run the focused test and confirm it passes.**

### Task 2: Make the homepage search compact and accessible

**Files:**
- Modify: `XHBlogs/components/SearchBar.tsx`
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Consumes: `filterPosts`
- Produces: homepage search form with query navigation and keyboard result selection

- [x] **Step 1: Add source-contract assertions for the compact width, maximum six results, Enter navigation, Escape handling, and `/timeline?q=`.**
- [x] **Step 2: Run the focused test and confirm failure.**
- [x] **Step 3: Implement compact styling, active result state, keyboard handling, and the full-results link.**
- [x] **Step 4: Re-run the focused test and confirm it passes.**

### Task 3: Connect the archive to URL search

**Files:**
- Create: `XHBlogs/components/TimelineArchive.tsx`
- Modify: `XHBlogs/app/timeline/page.tsx`
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**
- Produces: client archive search driven by `useSearchParams().get("q")`

- [x] **Step 1: Add source-contract assertions that timeline uses a Suspense-wrapped client archive and the client reads `q`.**
- [x] **Step 2: Run the focused test and confirm failure.**
- [x] **Step 3: Implement the client archive view with a search box, result count, empty state, and year grouping.**
- [x] **Step 4: Re-run the focused test and confirm it passes.**

### Task 4: Verify and deploy

- [x] Run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm build`.
- [x] In Chromium, test typing, Enter, arrow keys, Escape, result click, and `/timeline?q=`.
- [x] Run an independent code review, address blocking findings, merge to `main`, push, and verify production.
