# NASA Near-Real-Time Cloud Texture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the desktop procedural cloud pattern with a NASA GIBS near-real-time satellite mosaic and remove UV seams.

**Architecture:** Build a daily NASA GIBS WMS request for the latest safely available complete UTC observation day, two days behind current time. Load the mosaic as a 2048×1024 texture, extract only bright cloud pixels by comparing against the local Earth day texture, and render them below markers. Mobile remains unchanged.

**Tech Stack:** TypeScript、Three.js ShaderMaterial、NASA GIBS WMS、Node test runner

**Spec:** User observed seams in the procedural cloud layer and accepted a near-real-time global cloud image that does not need minute-level accuracy.

## Global Constraints

- Desktop only.
- Use the latest complete observation day, not an unavailable current-day mosaic.
- Ignore black GIBS swath gaps.
- Keep longitude wrapping enabled to remove date-line seams.
- Do not show cloud data over the mobile Earth.

---

### Task 1: Build NASA GIBS URL and cloud-mask shader

**Files:**
- Create: `XHBlogs/lib/earthClouds.ts`
- Modify: `XHBlogs/components/EarthAtmosphere.tsx`
- Modify: `XHBlogs/components/TravelGlobe.tsx`
- Test: `XHBlogs/tests/celestial.test.mjs`

- [ ] **Step 1: Add failing URL tests**

```javascript
test("builds a GIBS cloud URL for the latest safe observation day", () => {
  const url = gibsCloudMapUrl(new Date("2026-11-28T12:00:00Z"));
  assert.match(url, /VIIRS_NOAA20_CorrectedReflectance_TrueColor/);
  assert.match(url, /TIME=2026-11-26/);
  assert.match(url, /WIDTH=2048/);
  assert.match(url, /HEIGHT=1024/);
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `pnpm exec node --test --test-name-pattern="GIBS cloud URL" tests/celestial.test.mjs`

Expected: FAIL because `earthClouds.ts` does not exist.

- [ ] **Step 3: Implement the URL builder**

`latestCloudObservationDate()` subtracts two UTC days. `gibsCloudMapUrl()` returns the GIBS WMS URL with layer `VIIRS_NOAA20_CorrectedReflectance_TrueColor`, global EPSG:4326 bounds, 2048×1024 JPEG size and the calculated date.

- [ ] **Step 4: Add failing shader integration checks**

Assert that `EarthAtmosphere.tsx` contains `cloudMap`, `earthDayMap`, `RepeatWrapping`, `uHasClouds`, and no `fbm`.

- [ ] **Step 5: Implement the cloud mask**

Load the local day texture and remote GIBS texture separately without blocking the Earth. Set `wrapS = THREE.RepeatWrapping`, `wrapT = THREE.ClampToEdgeWrapping`, SRGB color space, and dispose both textures on cleanup.

Fragment shader extracts clouds with:

```glsl
float satelliteLuma = dot(satelliteColor, vec3(0.299, 0.587, 0.114));
float groundLuma = dot(groundColor, vec3(0.299, 0.587, 0.114));
float cloudDelta = satelliteLuma - groundLuma;
float spread = max(satelliteColor.r, max(satelliteColor.g, satelliteColor.b)) -
  min(satelliteColor.r, min(satelliteColor.g, satelliteColor.b));
float cloud = smoothstep(0.05, 0.22, cloudDelta) *
  (1.0 - smoothstep(0.22, 0.55, spread)) *
  smoothstep(0.015, 0.08, satelliteLuma);
```

Use the existing normal-based rim haze. Cloud opacity remains subtle.

- [ ] **Step 6: Verify**

Run: `pnpm test`

Run: `pnpm exec tsc --noEmit`

Run: `pnpm build`

Expected: all pass.
