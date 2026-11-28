# Satellite Cloud Volume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the desktop NASA satellite-cloud layer a subtle sense of depth and thickness without adding another network texture.

**Architecture:** Keep the existing satellite-mask extraction, then sample the mask around each pixel in the local direction of the sun. The resulting slope adds restrained highlight and blue-gray self-shadow inside cloud bodies, while the original cloud silhouette and marker ordering remain unchanged.

**Tech Stack:** TypeScript, React, Three.js ShaderMaterial, GLSL, Node test runner

**Spec:** User approved the bounded design: “保留卫星云轮廓，生成轻微的内部明暗和自阴影，只增强厚度，不额外增加贴图。”

## Global Constraints

- Desktop only; mobile remains unchanged.
- Do not add another texture download or duplicate the Earth texture.
- Keep marker labels above the cloud layer with `renderOrder={-1}`.
- Keep the effect subtle enough that geography and markers remain readable.
- Preserve the NASA GIBS black-gap rejection and date-line wrapping.

---

### Task 1: Add directional self-shading to satellite clouds

**Files:**

- Modify: `XHBlogs/components/EarthAtmosphere.tsx`
- Test: `XHBlogs/tests/celestial.test.mjs`

**Interfaces:**

- Consumes: `cloudMap: sampler2D`, `earthDayMap: sampler2D`, `sunDirection: vec3`
- Produces: `uCloudTexel: vec2` and the GLSL helper `cloudMask(vec2 uv)`

- [ ] **Step 1: Write the failing test**

```javascript
test("gives satellite clouds a subtle volumetric relief", () => {
  const atmosphere = fs.readFileSync(
    path.join(root, "components", "EarthAtmosphere.tsx"),
    "utf8",
  );

  assert.match(atmosphere, /float cloudMask\(vec2 uv\)/);
  assert.match(atmosphere, /uniform vec2 uCloudTexel/);
  assert.match(atmosphere, /vec2 tangentLight/);
  assert.match(atmosphere, /float cloudRelief/);
  assert.match(atmosphere, /vUv \+ tangentLight \* uCloudTexel/);
  assert.match(atmosphere, /vUv - tangentLight \* uCloudTexel/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
pnpm exec node --test --test-name-pattern="volumetric relief" tests/celestial.test.mjs
```

Expected: FAIL because `cloudMask` and the relief samples do not exist.

- [ ] **Step 3: Extract the cloud mask and add the relief samples**

Add `uniform vec2 uCloudTexel;` and this helper above `main`:

```glsl
float cloudMask(vec2 uv) {
  vec3 satelliteColor = texture2D(cloudMap, uv).rgb;
  vec3 groundColor = texture2D(earthDayMap, uv).rgb;
  float satelliteLuma = dot(
    satelliteColor,
    vec3(0.299, 0.587, 0.114)
  );
  float groundLuma = dot(groundColor, vec3(0.299, 0.587, 0.114));
  float spread =
    max(satelliteColor.r, max(satelliteColor.g, satelliteColor.b)) -
    min(satelliteColor.r, min(satelliteColor.g, satelliteColor.b));
  return
    smoothstep(0.05, 0.22, satelliteLuma - groundLuma) *
    (1.0 - smoothstep(0.22, 0.55, spread)) *
    smoothstep(0.015, 0.08, satelliteLuma);
}
```

In `main`, project the sun into the local sphere tangent plane:

```glsl
vec3 normal = normalize(vWorldNormal);
vec3 sunNormal = normalize(sunDirection);
vec3 east = normalize(
  vec3(normal.z, 0.0, -normal.x) + vec3(0.0001, 0.0, 0.0)
);
vec3 north = normalize(cross(normal, east));
vec2 tangentLight = normalize(
  vec2(dot(sunNormal, east), dot(sunNormal, north)) +
  vec2(0.0001)
);

float cloud = cloudMask(vUv) * uHasClouds;
float towardLight =
  cloudMask(vUv + tangentLight * uCloudTexel) * uHasClouds;
float awayFromLight =
  cloudMask(vUv - tangentLight * uCloudTexel) * uHasClouds;
float cloudRelief =
  (awayFromLight - towardLight) *
  smoothstep(0.1, 0.7, cloud);
```

Use `cloudRelief` to mix a cool self-shadow into the cloud color and a restrained top highlight:

```glsl
float shadedSlope = smoothstep(0.015, 0.18, -cloudRelief);
float litSlope = smoothstep(0.015, 0.18, cloudRelief);
vec3 shadowTint = vec3(0.16, 0.21, 0.28);
cloudColor = mix(
  cloudColor,
  shadowTint,
  shadedSlope * sunlight * 0.3
);
cloudColor = mix(
  cloudColor,
  vec3(1.0),
  litSlope * sunlight * 0.12
);
```

- [ ] **Step 4: Initialize the texel-size uniform from the loaded satellite image**

Add `uCloudTexel: { value: new THREE.Vector2(1 / 2048, 1 / 1024) }` to the material uniforms. After the NASA texture loads and before enabling `uHasClouds`, update it:

```typescript
const image = texture.image as
  | { width?: number; height?: number }
  | undefined;
material.uniforms.uCloudTexel.value.set(
  1 / (image?.width ?? 2048),
  1 / (image?.height ?? 1024),
);
```

- [ ] **Step 5: Run the focused test to verify it passes**

Run:

```powershell
pnpm exec node --test --test-name-pattern="volumetric relief" tests/celestial.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Run full verification**

Run:

```powershell
$env:CI='true'; pnpm test
$env:CI='true'; pnpm exec tsc --noEmit
$env:CI='true'; pnpm build
```

Expected: tests report 100+ passes with zero failures, TypeScript exits 0, and the production build succeeds.

- [ ] **Step 7: Verify visually and commit**

Open the production build at desktop width, select Tokyo, confirm that cloud bands have restrained light/shadow depth and marker labels remain unobstructed. Then run:

```powershell
git add XHBlogs/components/EarthAtmosphere.tsx XHBlogs/tests/celestial.test.mjs docs/superpowers/plans/2026-11-28-cloud-volume.md
git commit -m "style: add depth to satellite clouds"
```
