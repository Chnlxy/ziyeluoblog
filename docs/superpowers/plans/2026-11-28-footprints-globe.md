# 旅行足迹地球仪实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增真实 3D“足迹”页面，以杭州为起点展示旅行地点、实时晨昏线和可点击弧线，并关联已有旅行照片。

**Architecture:** 静态旅行数据先放在 `data/travel.ts`。纯函数层负责数据校验、经纬度转换、太阳方向和球面弧线采样；客户端 React Three Fiber 场景只负责渲染与交互。页面由 Next.js 静态导出，所有纹理和照片在站内加载。

**Tech Stack:** Next.js 16.2.1、React 19.2.4、TypeScript 5、Three.js、React Three Fiber、Drei、Node test runner

**Spec:** `docs/superpowers/specs/2026-11-28-footprints-globe-design.md`

## Global Constraints

- 第一版只使用静态数据，不提供地点录入后台。
- 主导航在“照片墙”后新增“足迹”，路径固定为 `/footprints/`。
- 杭州坐标固定为经度 `120.1551`、纬度 `30.2741`，不写入目的地列表。
- 首版目的地至少包含东京，并复用 `/images/albums/travel-silhouettes/26.webp`。
- 平时不显示所有弧线；点击目的地后只显示杭州到该目的地的一条弧线。
- 地球昼夜效果使用当前真实 UTC 时间和本地昼夜纹理。
- 运行时不得依赖第三方 CDN 加载地球纹理。
- 桌面设备像素比上限为 `2`，手机设备像素比上限为 `1.5`。
- 必须在 WebGL 不可用时显示地点列表。
- 不修改启动页 GIF、现有背景和既有头像。

---

### Task 1: 旅行数据、太阳方向与球面几何

**Files:**
- Create: `XHBlogs/data/travel.ts`
- Create: `XHBlogs/lib/travel.ts`
- Create: `XHBlogs/tests/travel.test.mjs`

**Interfaces:**
- Produces:

```ts
export interface TravelVisit {
  date: string;
  endDate?: string;
  note?: string;
  photos: string[];
}

export interface TravelPlace {
  id: string;
  name: string;
  country: string;
  coordinates: [longitude: number, latitude: number];
  visits: TravelVisit[];
}

export const hangzhouHome: {
  name: "杭州";
  coordinates: readonly [120.1551, 30.2741];
};

export function validateTravelPlaces(places: TravelPlace[]): void;
export function latLngToVector3(
  coordinates: [number, number],
  radius?: number,
): [number, number, number];
export function sampleGreatCircleArc(
  from: [number, number],
  to: [number, number],
  segments?: number,
  height?: number,
): Array<[number, number, number]>;
export function solarDirection(date: Date): [number, number, number];
```

- Consumes: no earlier task.

- [ ] **Step 1: Write failing tests for data validation and geometry**

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  hangzhouHome,
  latLngToVector3,
  sampleGreatCircleArc,
  solarDirection,
  validateTravelPlaces,
} from "../lib/travel.ts";

const tokyo = {
  id: "tokyo",
  name: "东京",
  country: "日本",
  coordinates: [139.6917, 35.6895],
  visits: [
    {
      date: "2026-11-20",
      endDate: "2026-11-25",
      note: "涩谷的夜色",
      photos: ["/images/albums/travel-silhouettes/26.webp"],
    },
  ],
};

test("accepts a valid travel place", () => {
  assert.doesNotThrow(() => validateTravelPlaces([tokyo]));
});

test("rejects duplicate IDs and invalid locations", () => {
  assert.throws(
    () => validateTravelPlaces([tokyo, { ...tokyo }]),
    /重复/,
  );
  assert.throws(
    () =>
      validateTravelPlaces([
        { ...tokyo, id: "bad id", coordinates: [181, 0] },
      ]),
    /id|经度/,
  );
});

test("rejects invalid dates and unsafe photo URLs", () => {
  assert.throws(
    () =>
      validateTravelPlaces([
        {
          ...tokyo,
          visits: [
            {
              date: "2026-11-25",
              endDate: "2026-11-20",
              photos: ["javascript:alert(1)"],
            },
          ],
        },
      ]),
    /结束日期|照片/,
  );
});

test("maps coordinates onto a unit sphere", () => {
  const point = latLngToVector3([0, 0]);
  assert.ok(Math.abs(point[0]) < 1e-9);
  assert.ok(Math.abs(point[1] - 1) < 1e-9);
  assert.ok(Math.abs(point[2]) < 1e-9);
});

test("draws an arc from Hangzhou to Tokyo with lifted midpoints", () => {
  const points = sampleGreatCircleArc(
    [...hangzhouHome.coordinates],
    tokyo.coordinates,
    32,
    0.18,
  );
  assert.equal(points.length, 33);
  assert.ok(
    Math.hypot(...points[0]) -
      Math.hypot(...latLngToVector3([...hangzhouHome.coordinates])) <
      1e-9,
  );
  assert.ok(Math.max(...points.map((point) => Math.hypot(...point))) > 1.1);
});

test("changes solar direction between summer and winter", () => {
  const summer = solarDirection(new Date("2026-06-21T12:00:00Z"));
  const winter = solarDirection(new Date("2026-12-21T12:00:00Z"));
  assert.ok(summer[1] > 0.35);
  assert.ok(winter[1] < -0.35);
  for (const point of [summer, winter]) {
    assert.ok(Math.abs(Math.hypot(...point) - 1) < 1e-9);
  }
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec node --test tests/travel.test.mjs`

Expected: FAIL because `lib/travel.ts` does not exist.

- [ ] **Step 3: Create the Tokyo static data**

```ts
import type { TravelPlace } from "../lib/travel";

export const travelPlaces: TravelPlace[] = [
  {
    id: "tokyo",
    name: "东京",
    country: "日本",
    coordinates: [139.6917, 35.6895],
    visits: [
      {
        date: "2026-11-20",
        endDate: "2026-11-25",
        note: "涩谷与东京夜色",
        photos: ["/images/albums/travel-silhouettes/26.webp"],
      },
    ],
  },
];
```

The dates are initial placeholders based on the current travel album; the static file is the only place to change them.

- [ ] **Step 4: Implement validation and coordinate conversion**

Use this coordinate convention consistently for the globe, markers, arcs and sun:

```ts
export function latLngToVector3(
  [longitude, latitude]: [number, number],
  radius = 1,
): [number, number, number] {
  const phi = ((90 - latitude) * Math.PI) / 180;
  const theta = ((longitude + 180) * Math.PI) / 180;
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}
```

`validateTravelPlaces` must enforce every rule in the spec. Accept only:

- `id` matching `/^[a-z0-9-]+$/`
- coordinate ranges `[-180, 180]` and `[-90, 90]`
- ISO calendar dates in `YYYY-MM-DD`
- existing station-relative paths beginning with a single `/`
- HTTP(S) photo URLs

- [ ] **Step 5: Implement great-circle sampling and solar direction**

Great-circle sampling:

```ts
const start = latLngToVector3(from);
const end = latLngToVector3(to);
const omega = Math.acos(clamp(dot(start, end), -1, 1));

for (let index = 0; index <= segments; index += 1) {
  const t = index / segments;
  const direction = normalize(slerp(start, end, omega, t));
  const distance = omega * Math.sin(Math.PI * t);
  const radius = 1 + height * Math.min(1, distance);
  points.push(direction.map((value) => value * radius));
}
```

Solar direction:

1. Convert UTC timestamp to a fractional day of year.
2. Approximate solar declination with
   `23.44° * sin(2π * (284 + dayOfYear) / 365)`.
3. Approximate the subsolar longitude from UTC hours:
   `180 - (utcHours + utcMinutes / 60 + utcSeconds / 3600) * 15`.
4. Convert `[subsolarLongitude, solarDeclination]` through `latLngToVector3`.
5. Normalize the result.

- [ ] **Step 6: Run the focused test**

Run: `pnpm exec node --test tests/travel.test.mjs`

Expected: all tests pass.

- [ ] **Step 7: Commit**

```powershell
git add XHBlogs/data/travel.ts XHBlogs/lib/travel.ts XHBlogs/tests/travel.test.mjs
git commit -m "feat: add travel globe geometry"
```

### Task 2: Three.js 地球、实时晨昏与标记

**Files:**
- Modify: `XHBlogs/package.json`
- Modify: `XHBlogs/pnpm-lock.yaml`
- Create: `XHBlogs/components/TravelGlobe.tsx`
- Create: `XHBlogs/public/images/globe/earth-day.jpg`
- Create: `XHBlogs/public/images/globe/earth-night.jpg`
- Create: `XHBlogs/public/images/globe/README.md`
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**

```ts
export default function TravelGlobe({
  places,
  selectedId,
  onSelect,
}: {
  places: TravelPlace[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}): React.ReactElement;
```

- Consumes: `latLngToVector3`, `sampleGreatCircleArc`, `solarDirection`, `hangzhouHome`.
- Produces: interactive globe canvas with `aria-label="旅行足迹地球"`.

- [ ] **Step 1: Add failing source-contract tests**

Append to `XHBlogs/tests/ziyeluo-config.test.mjs`:

```js
test("ships a real 3D travel globe with local earth textures", () => {
  const globePath = path.join(root, "components", "TravelGlobe.tsx");
  const dayTexture = path.join(root, "public", "images", "globe", "earth-day.jpg");
  const nightTexture = path.join(root, "public", "images", "globe", "earth-night.jpg");

  assert.ok(fs.existsSync(globePath));
  assert.ok(fs.existsSync(dayTexture));
  assert.ok(fs.existsSync(nightTexture));
  assert.ok(fs.statSync(dayTexture).size < 3 * 1024 * 1024);
  assert.ok(fs.statSync(nightTexture).size < 3 * 1024 * 1024);

  const globe = fs.readFileSync(globePath, "utf8");
  assert.match(globe, /@react-three\/fiber/);
  assert.match(globe, /solarDirection/);
  assert.match(globe, /earth-day\.jpg/);
  assert.match(globe, /earth-night\.jpg/);
  assert.match(globe, /aria-label="旅行足迹地球"/);
  assert.doesNotMatch(globe, /https:\/\/unpkg\.com/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec node --test tests/ziyeluo-config.test.mjs`

Expected: FAIL because `TravelGlobe.tsx` and texture files do not exist.

- [ ] **Step 3: Install the rendering dependencies**

Run:

```powershell
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/three
```

- [ ] **Step 4: Download and document local textures**

Run:

```powershell
New-Item -ItemType Directory -Force public/images/globe | Out-Null
Invoke-WebRequest -Uri https://unpkg.com/three-globe@2.45.6/example/img/earth-blue-marble.jpg -OutFile public/images/globe/earth-day.jpg
Invoke-WebRequest -Uri https://unpkg.com/three-globe@2.45.6/example/img/earth-night.jpg -OutFile public/images/globe/earth-night.jpg
```

Write `public/images/globe/README.md` with both source URLs, the `three-globe` MIT attribution, and the note that NASA Earth imagery is public domain.

- [ ] **Step 5: Implement the shader material**

Use `vUv` and the normalized model normal. The fragment logic must contain:

```glsl
float sun = dot(normalize(vNormal), normalize(sunDirection));
float daylight = smoothstep(-0.12, 0.14, sun);
vec3 dayColor = texture2D(dayMap, vUv).rgb * 1.08;
vec3 nightColor = texture2D(nightMap, vUv).rgb * 0.78;
vec3 color = mix(nightColor, dayColor, daylight);
float twilight = 1.0 - smoothstep(0.0, 0.42, abs(sun));
color += vec3(0.32, 0.15, 0.035) * twilight * 0.32;
gl_FragColor = vec4(color, 1.0);
```

Set both textures to `SRGBColorSpace`.

- [ ] **Step 6: Implement scene controls and current time**

Use:

```tsx
<Canvas
  aria-label="旅行足迹地球"
  camera={{ position: [0, 0.6, 3.2], fov: 42 }}
  dpr={[1, 2]}
  gl={{ antialias: true, alpha: true }}
>
  <TravelScene places={places} selectedId={selectedId} onSelect={onSelect} />
</Canvas>
```

Inside `TravelScene`:

- Use `OrbitControls` with `enablePan={false}`, `minDistance={2.35}`, `maxDistance={4.1}`.
- Start at `autoRotateSpeed={0.22}`.
- Use `onStart` to set `autoRotate=false`.
- Use `onEnd` to resume after a 4-second timer.
- Read `prefers-reduced-motion`; when true, keep `autoRotate=false` and complete route animation immediately.
- Update the sun uniform with `solarDirection(new Date())` every 60 seconds.
- Use a sphere radius of `1` with `96` width segments on desktop and `64` on mobile.
- Use `onPointerMissed={() => onSelect(null)}` on the Canvas.

- [ ] **Step 7: Implement markers and selected route**

- Convert each destination with `latLngToVector3(coordinates, 1.025)`.
- Render a gold marker mesh with a stable screen-space scale.
- Show the place name on pointer hover or keyboard focus; touch taps select the marker.
- Hide a marker label when the point is behind the sphere.
- Clicking a marker calls `onSelect(place.id)`.
- Hangzhou gets a distinct home marker at radius `1.028`.
- When `selectedId` changes, call `sampleGreatCircleArc` and replace the line geometry.
- Animate the route from `setDrawRange(0, 0)` to the full point count over 700 ms.
- Dispose route geometry and material on unmount.

- [ ] **Step 8: Run tests and typecheck**

Run:

```powershell
pnpm exec node --test tests/ziyeluo-config.test.mjs
pnpm exec tsc --noEmit
```

Expected: both commands exit 0.

- [ ] **Step 9: Commit**

```powershell
git add XHBlogs/package.json XHBlogs/pnpm-lock.yaml XHBlogs/components/TravelGlobe.tsx XHBlogs/public/images/globe XHBlogs/tests/ziyeluo-config.test.mjs
git commit -m "feat: render travel globe"
```

### Task 3: 足迹页面、地点面板与导航

**Files:**
- Modify: `XHBlogs/siteConfig.ts`
- Create: `XHBlogs/app/footprints/page.tsx`
- Create: `XHBlogs/app/footprints/FootprintsClient.tsx`
- Create: `XHBlogs/components/TravelDetailPanel.tsx`
- Modify: `XHBlogs/components/MomentImageLightbox.tsx`
- Modify: `XHBlogs/tests/ziyeluo-config.test.mjs`

**Interfaces:**

```ts
// FootprintsClient
const [selectedId, setSelectedId] = useState<string | null>(null);

// TravelDetailPanel
export default function TravelDetailPanel({
  place,
  onClose,
}: {
  place: TravelPlace;
  onClose: () => void;
}): React.ReactElement | null;
```

- Consumes: `TravelGlobe`, `travelPlaces`, `validateTravelPlaces`, `MomentImageLightbox`.
- Produces: `/footprints/` route and navigation entry.

- [ ] **Step 1: Write failing route and panel tests**

Append to `XHBlogs/tests/ziyeluo-config.test.mjs`:

```js
test("adds the footprints route and travel detail panel", () => {
  const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");
  const pagePath = path.join(root, "app", "footprints", "page.tsx");
  const clientPath = path.join(root, "app", "footprints", "FootprintsClient.tsx");
  const panelPath = path.join(root, "components", "TravelDetailPanel.tsx");

  assert.match(config, /name:\s*"足迹"/);
  assert.match(config, /href:\s*"\/footprints"/);
  assert.ok(fs.existsSync(pagePath));
  assert.ok(fs.existsSync(clientPath));
  assert.ok(fs.existsSync(panelPath));

  const client = fs.readFileSync(clientPath, "utf8");
  const panel = fs.readFileSync(panelPath, "utf8");
  assert.match(client, /TravelGlobe/);
  assert.match(client, /TravelDetailPanel/);
  assert.match(client, /selectedId/);
  assert.match(panel, /role="dialog"/);
  assert.match(panel, /event\.key === "Escape"/);
  assert.match(panel, /MomentImageLightbox/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec node --test tests/ziyeluo-config.test.mjs`

Expected: FAIL because the navigation entry and footprint files do not exist.

- [ ] **Step 3: Add navigation configuration**

Insert after “照片墙”:

```ts
{ name: "足迹", href: "/footprints" },
```

- [ ] **Step 4: Create the static page**

```tsx
import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import { siteConfig } from "../../siteConfig";
import FootprintsClient from "./FootprintsClient";

export const metadata: Metadata = {
  title: `足迹 | ${siteConfig.title}`,
  description: "从杭州出发，记录去过的地方。",
};

export default function FootprintsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <PageTransition className="flex-1">
        <FootprintsClient />
      </PageTransition>
    </div>
  );
}
```

- [ ] **Step 5: Create the client layout and WebGL fallback**

`FootprintsClient` must:

- call `validateTravelPlaces(travelPlaces)` once before rendering
- render `/footprints/` heading and an instruction to click a destination
- dynamically import `TravelGlobe` with `{ ssr: false }`
- place the globe in a `min-h-[68dvh]` glass panel
- show a loading panel while the 3D component loads
- detect WebGL support with a temporary canvas
- render a location list with names, dates and a photo count when WebGL is unavailable
- pass `selectedId` and `setSelectedId`
- render `TravelDetailPanel` only when a selected place exists

- [ ] **Step 6: Build the detail panel**

Desktop classes use a right-side fixed panel; mobile classes use a bottom sheet:

```tsx
<aside
  role="dialog"
  aria-modal="true"
  aria-label={`${place.name}旅行详情`}
  className="fixed inset-x-3 bottom-3 z-[80] max-h-[72dvh] overflow-y-auto rounded-3xl border border-white/15 bg-[#20211b]/95 p-5 shadow-2xl backdrop-blur-3xl desktop:inset-y-24 desktop:bottom-auto desktop:left-auto desktop:right-5 desktop:w-[390px]"
>
```

Render visits in descending date order. Add a visible close button, close on Escape, and use `MomentImageLightbox` for the flattened photo list.

- [ ] **Step 7: Make the shared lightbox label generic**

Modify `MomentImageLightbox`:

```tsx
export default function MomentImageLightbox({
  images,
  index,
  onClose,
  onChange,
  ariaLabel = "查看图片",
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
  ariaLabel?: string;
})
```

Use `aria-label={ariaLabel}` on the dialog. Existing callers remain unchanged.

- [ ] **Step 8: Run focused tests**

Run: `pnpm exec node --test tests/travel.test.mjs tests/ziyeluo-config.test.mjs`

Expected: all tests pass.

- [ ] **Step 9: Commit**

```powershell
git add XHBlogs/siteConfig.ts XHBlogs/app/footprints XHBlogs/components/TravelDetailPanel.tsx XHBlogs/components/MomentImageLightbox.tsx XHBlogs/tests/ziyeluo-config.test.mjs
git commit -m "feat: add footprints page"
```

### Task 4: 完整验收与部署

**Files:**
- No new production files.

- [ ] **Step 1: Run the full local verification**

Run:

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Expected:

- all Node tests pass
- TypeScript exits 0
- Next.js static export lists `/footprints`

- [ ] **Step 2: Inspect the build output**

Run:

```powershell
Get-ChildItem out\footprints
```

Expected: the static route contains `index.html`.

- [ ] **Step 3: Browser acceptance on `https://www.wakaba.cc/footprints/`**

Verify:

1. The globe texture loads from `/images/globe/earth-day.jpg`.
2. The night texture loads from `/images/globe/earth-night.jpg`.
3. The globe rotates, drags and zooms.
4. Tokyo is visible as a marker.
5. Clicking Tokyo shows the Hangzhou arc and detail panel.
6. The panel shows “涩谷与东京夜色” and photo `26.webp`.
7. Clicking the photo opens the existing lightbox.
8. Escape closes the panel and removes the arc.
9. Mobile layout uses the bottom sheet.
10. WebGL fallback lists Tokyo when Canvas creation is blocked.

- [ ] **Step 4: Request final code review**

Review the completed diff against the spec and plan, fix every Critical or Important finding, and rerun all verification commands.

- [ ] **Step 5: Publish**

Commit the final fixes. Push/update the GitHub repository and confirm the Cloudflare Pages deployment for `/footprints/`.

The final deployment report must include:

- exact tested URL
- test count
- TypeScript/build status
- Cloudflare deployment status
- the static data path the user edits to add future destinations

