# 真实星空、太阳与月亮 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在足迹地球场景中加入约 50 颗真实亮星、当前太阳方向、真实月亮方向与月相，并保证相机旋转和地球遮挡正确。

**Architecture:** 用 `astronomy-engine` 计算地心天体坐标和恒星时。恒星、太阳、月亮先进入日期赤道坐标，再放入地球北极轴上的 Three.js 天球组；天球组按恒星时连续旋转。太阳的地球固定方向单独驱动现有昼夜着色器。

**Tech Stack:** TypeScript、React Three Fiber、Three.js、astronomy-engine、Node.js test runner

**Spec:** `docs/superpowers/specs/2026-11-28-celestial-sky-design.md`

## Global Constraints

- 使用当前真实 UTC 时间，不提供日期选择器。
- 观察基准为地球整体，不绑定城市。
- 显示约 50 颗全天最亮恒星，不显示名称或星座连线。
- 太阳、月亮和月相必须由真实天文计算得出。
- 天体位于 Three.js 三维场景中，不使用屏幕固定贴图。
- 地球通过深度测试自然遮挡其后方天体。
- 页面不可见或画布离屏时暂停天文更新。
- 不改变现有地球、详情框、背景图或页面容器尺寸。

---

### Task 1: 添加天文依赖、恒星数据和来源说明

**Files:**
- Modify: `XHBlogs/package.json`
- Modify: `XHBlogs/pnpm-lock.yaml`
- Create: `XHBlogs/data/brightStars.ts`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `XHBlogs/tests/celestial.test.mjs`

**Interfaces:**

```typescript
export interface BrightStar {
  id: string;
  rightAscensionHours: number;
  declinationDegrees: number;
  magnitude: number;
  colorIndex?: number;
}

export const brightStars: BrightStar[];
```

- [ ] **Step 1: 写失败的数据测试**

```javascript
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { brightStars } from "../data/brightStars.ts";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test("ships 50 valid stars sorted from bright to dim", () => {
  assert.equal(brightStars.length, 50);
  for (let index = 1; index < brightStars.length; index++) {
    assert.ok(
      brightStars[index - 1].magnitude <=
        brightStars[index].magnitude,
    );
  }
  for (const star of brightStars) {
    assert.ok(star.rightAscensionHours >= 0);
    assert.ok(star.rightAscensionHours < 24);
    assert.ok(star.declinationDegrees >= -90);
    assert.ok(star.declinationDegrees <= 90);
    assert.ok(Number.isFinite(star.magnitude));
  }
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm exec node --test --test-name-pattern="50 valid stars" tests/celestial.test.mjs`

Expected: FAIL；`brightStars` 尚不存在。

- [ ] **Step 3: 安装依赖并写数据**

Run:

```bash
pnpm add astronomy-engine@2.1.19
```

创建 `XHBlogs/data/brightStars.ts`，数据取自 BSD-3-Clause 许可的 `d3-celestial` 星表 `stars.6.json` 按视星等排序后的前 50 项：

```typescript
export interface BrightStar {
  id: string;
  rightAscensionHours: number;
  declinationDegrees: number;
  magnitude: number;
  colorIndex?: number;
}

export const brightStars: BrightStar[] = [
  { id: "hip-32349", rightAscensionHours: 6.75248, declinationDegrees: -16.7161, magnitude: -1.44, colorIndex: 0.009 },
  { id: "hip-30438", rightAscensionHours: 6.3992, declinationDegrees: -52.6957, magnitude: -0.62, colorIndex: 0.164 },
  { id: "hip-69673", rightAscensionHours: 14.26102, declinationDegrees: 19.1824, magnitude: -0.05, colorIndex: 1.239 },
  { id: "hip-71683", rightAscensionHours: 14.66014, declinationDegrees: -60.834, magnitude: -0.01, colorIndex: 0.71 },
  { id: "hip-91262", rightAscensionHours: 18.615647, declinationDegrees: 38.7837, magnitude: 0.03, colorIndex: -0.001 },
  { id: "hip-24608", rightAscensionHours: 5.278153, declinationDegrees: 45.998, magnitude: 0.08, colorIndex: 0.795 },
  { id: "hip-24436", rightAscensionHours: 5.2423, declinationDegrees: -8.2016, magnitude: 0.18, colorIndex: -0.03 },
  { id: "hip-37279", rightAscensionHours: 7.655033, declinationDegrees: 5.225, magnitude: 0.4, colorIndex: 0.432 },
  { id: "hip-7588", rightAscensionHours: 1.628567, declinationDegrees: -57.2368, magnitude: 0.45, colorIndex: -0.158 },
  { id: "hip-27989", rightAscensionHours: 5.919527, declinationDegrees: 7.4071, magnitude: 0.45, colorIndex: 1.5 },
  { id: "hip-68702", rightAscensionHours: 14.063727, declinationDegrees: -60.373, magnitude: 0.61, colorIndex: -0.231 },
  { id: "hip-97649", rightAscensionHours: 19.846387, declinationDegrees: 8.8683, magnitude: 0.76, colorIndex: 0.221 },
  { id: "hip-60718", rightAscensionHours: 12.443307, declinationDegrees: -63.0991, magnitude: 0.77, colorIndex: -0.243 },
  { id: "hip-21421", rightAscensionHours: 4.59868, declinationDegrees: 16.5093, magnitude: 0.87, colorIndex: 1.538 },
  { id: "hip-65474", rightAscensionHours: 13.41988, declinationDegrees: -11.1613, magnitude: 0.98, colorIndex: -0.235 },
  { id: "hip-80763", rightAscensionHours: 16.490127, declinationDegrees: -26.432, magnitude: 1.06, colorIndex: 1.865 },
  { id: "hip-37826", rightAscensionHours: 7.755267, declinationDegrees: 28.0262, magnitude: 1.16, colorIndex: 0.991 },
  { id: "hip-113368", rightAscensionHours: 22.960847, declinationDegrees: -29.6222, magnitude: 1.17, colorIndex: 0.145 },
  { id: "hip-102098", rightAscensionHours: 20.690533, declinationDegrees: 45.2803, magnitude: 1.25, colorIndex: 0.092 },
  { id: "hip-62434", rightAscensionHours: 12.795353, declinationDegrees: -59.6888, magnitude: 1.25, colorIndex: -0.238 },
  { id: "hip-71681", rightAscensionHours: 14.659747, declinationDegrees: -60.8372, magnitude: 1.35, colorIndex: 0.9 },
  { id: "hip-49669", rightAscensionHours: 10.139533, declinationDegrees: 11.9672, magnitude: 1.36, colorIndex: -0.087 },
  { id: "hip-33579", rightAscensionHours: 6.9771, declinationDegrees: -28.9721, magnitude: 1.5, colorIndex: -0.211 },
  { id: "hip-36850", rightAscensionHours: 7.576627, declinationDegrees: 31.8883, magnitude: 1.58, colorIndex: 0.034 },
  { id: "hip-61084", rightAscensionHours: 12.519433, declinationDegrees: -57.1132, magnitude: 1.59, colorIndex: 1.6 },
  { id: "hip-85927", rightAscensionHours: 17.560147, declinationDegrees: -37.1038, magnitude: 1.62, colorIndex: -0.231 },
  { id: "hip-25336", rightAscensionHours: 5.418853, declinationDegrees: 6.3497, magnitude: 1.64, colorIndex: -0.224 },
  { id: "hip-25428", rightAscensionHours: 5.4382, declinationDegrees: 28.6075, magnitude: 1.65, colorIndex: -0.13 },
  { id: "hip-45238", rightAscensionHours: 9.219993, declinationDegrees: -69.7172, magnitude: 1.67, colorIndex: 0.07 },
  { id: "hip-26311", rightAscensionHours: 5.60356, declinationDegrees: -1.2019, magnitude: 1.69, colorIndex: -0.184 },
  { id: "hip-109268", rightAscensionHours: 22.13722, declinationDegrees: -46.961, magnitude: 1.73, colorIndex: -0.07 },
  { id: "hip-26727", rightAscensionHours: 5.679313, declinationDegrees: -1.9426, magnitude: 1.74, colorIndex: -0.199 },
  { id: "hip-39953", rightAscensionHours: 8.158873, declinationDegrees: -47.3366, magnitude: 1.75, colorIndex: -0.145 },
  { id: "hip-62956", rightAscensionHours: 12.900487, declinationDegrees: 55.9598, magnitude: 1.76, colorIndex: -0.022 },
  { id: "hip-90185", rightAscensionHours: 18.402867, declinationDegrees: -34.3846, magnitude: 1.79, colorIndex: -0.031 },
  { id: "hip-15863", rightAscensionHours: 3.40538, declinationDegrees: 49.8612, magnitude: 1.79, colorIndex: 0.481 },
  { id: "hip-54061", rightAscensionHours: 11.062133, declinationDegrees: 61.751, magnitude: 1.81, colorIndex: 1.061 },
  { id: "hip-34444", rightAscensionHours: 7.13986, declinationDegrees: -26.3932, magnitude: 1.83, colorIndex: 0.671 },
  { id: "hip-67301", rightAscensionHours: 13.792347, declinationDegrees: 49.3133, magnitude: 1.85, colorIndex: -0.099 },
  { id: "hip-41037", rightAscensionHours: 8.375233, declinationDegrees: -59.5095, magnitude: 1.86, colorIndex: 1.196 },
  { id: "hip-86228", rightAscensionHours: 17.62198, declinationDegrees: -42.9978, magnitude: 1.86, colorIndex: 0.406 },
  { id: "hip-28360", rightAscensionHours: 5.992147, declinationDegrees: 44.9474, magnitude: 1.9, colorIndex: 0.077 },
  { id: "hip-82273", rightAscensionHours: 16.81108, declinationDegrees: -69.0277, magnitude: 1.91, colorIndex: 1.447 },
  { id: "hip-31681", rightAscensionHours: 6.628527, declinationDegrees: 16.3993, magnitude: 1.93, colorIndex: 0.001 },
  { id: "hip-42913", rightAscensionHours: 8.74506, declinationDegrees: -54.7088, magnitude: 1.93, colorIndex: 0.043 },
  { id: "hip-100751", rightAscensionHours: 20.42746, declinationDegrees: -56.7351, magnitude: 1.94, colorIndex: -0.118 },
  { id: "hip-11767", rightAscensionHours: 2.5303, declinationDegrees: 89.2641, magnitude: 1.97, colorIndex: 0.636 },
  { id: "hip-30324", rightAscensionHours: 6.378327, declinationDegrees: -17.9559, magnitude: 1.98, colorIndex: -0.24 },
  { id: "hip-46390", rightAscensionHours: 9.459787, declinationDegrees: -8.6586, magnitude: 1.99, colorIndex: 1.44 },
  { id: "hip-50583", rightAscensionHours: 10.332873, declinationDegrees: 19.8415, magnitude: 2.01, colorIndex: 1.128 },
];
```

创建根目录 `THIRD_PARTY_NOTICES.md`，记录：

```markdown
# Third-Party Notices

## astronomy-engine

- Version: 2.1.19
- License: MIT
- Source: https://github.com/cosinekitty/astronomy

## d3-celestial star data

- Project: https://github.com/ofrohn/d3-celestial
- License: BSD-3-Clause
- Used data: the 50 brightest entries from `data/stars.6.json`
```

- [ ] **Step 4: 运行数据测试**

Run: `pnpm exec node --test --test-name-pattern="50 valid stars" tests/celestial.test.mjs`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add XHBlogs/package.json XHBlogs/pnpm-lock.yaml XHBlogs/data/brightStars.ts XHBlogs/tests/celestial.test.mjs THIRD_PARTY_NOTICES.md
git commit -m "feat: add bright star catalog"
```

---

### Task 2: 实现真实天文快照

**Files:**
- Create: `XHBlogs/lib/celestial.ts`
- Modify: `XHBlogs/tests/celestial.test.mjs`

**Interfaces:**

```typescript
export interface CelestialSnapshot {
  capturedAt: Date;
  celestialRotationRadians: number;
  sunDirectionEarthFixed: [number, number, number];
  sunCelestialDirection: [number, number, number];
  moonCelestialDirection: [number, number, number];
  moonLightCelestialDirection: [number, number, number];
  moonIlluminatedFraction: number;
  starsCelestial: Array<{
    id: string;
    direction: [number, number, number];
    magnitude: number;
    colorIndex?: number;
  }>;
}

export function buildCelestialSnapshot(
  date: Date,
): CelestialSnapshot;
```

- [ ] **Step 1: 添加失败的数学测试**

```javascript
import {
  buildCelestialSnapshot,
} from "../lib/celestial.ts";
import { solarDirection } from "../lib/travel.ts";

test("aligns calculated sun with the existing day-night direction", () => {
  const date = new Date("2026-06-21T12:00:00Z");
  const snapshot = buildCelestialSnapshot(date);
  const legacy = solarDirection(date);
  const alignment =
    snapshot.sunDirectionEarthFixed[0] * legacy[0] +
    snapshot.sunDirectionEarthFixed[1] * legacy[1] +
    snapshot.sunDirectionEarthFixed[2] * legacy[2];

  assert.ok(alignment > Math.cos(Math.PI / 180));
});

test("reports real full and new moon illumination", () => {
  const fullMoon = buildCelestialSnapshot(
    new Date("2026-01-03T10:00:00Z"),
  );
  const newMoon = buildCelestialSnapshot(
    new Date("2026-01-18T20:00:00Z"),
  );

  assert.ok(fullMoon.moonIlluminatedFraction > 0.99);
  assert.ok(newMoon.moonIlluminatedFraction < 0.01);
});

test("returns finite unit vectors for every celestial object", () => {
  const date = new Date("2026-11-28T00:00:00Z");
  const snapshot = buildCelestialSnapshot(date);
  const vectors = [
    snapshot.sunDirectionEarthFixed,
    snapshot.sunCelestialDirection,
    snapshot.moonCelestialDirection,
    snapshot.moonLightCelestialDirection,
    ...snapshot.starsCelestial.map((star) => star.direction),
  ];

  for (const vector of vectors) {
    assert.ok(vector.every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-9);
  }
  assert.throws(
    () => buildCelestialSnapshot(new Date("invalid")),
    /有效日期/,
  );
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm exec node --test --test-name-pattern="calculated sun|real full and new moon|finite unit vectors" tests/celestial.test.mjs`

Expected: FAIL；`lib/celestial.ts` 尚不存在。

- [ ] **Step 3: 实现坐标与天文计算**

`XHBlogs/lib/celestial.ts` 使用以下公共逻辑：

```typescript
import {
  Body,
  GeoVector,
  Illumination,
  Rotation_EQJ_EQD,
  SiderealTime,
} from "astronomy-engine";

import { brightStars } from "../data/brightStars";
import { solarDirection } from "./travel";

function normalize(v: [number, number, number]) {
  const length = Math.hypot(...v) || 1;
  return v.map((value) => value / length) as [
    number,
    number,
    number,
  ];
}

function astronomyToScene(v: [number, number, number]) {
  return [v[0], v[2], -v[1]] as [number, number, number];
}

function raDecToEqj(raHours: number, decDegrees: number) {
  const ra = (raHours * Math.PI) / 12;
  const dec = (decDegrees * Math.PI) / 180;
  return [
    Math.cos(dec) * Math.cos(ra),
    Math.cos(dec) * Math.sin(ra),
    Math.sin(dec),
  ] as [number, number, number];
}

function rotateWithMatrix(
  matrix: number[][],
  v: [number, number, number],
) {
  return normalize([
    matrix[0][0] * v[0] + matrix[0][1] * v[1] + matrix[0][2] * v[2],
    matrix[1][0] * v[0] + matrix[1][1] * v[1] + matrix[1][2] * v[2],
    matrix[2][0] * v[0] + matrix[2][1] * v[1] + matrix[2][2] * v[2],
  ]);
}

function rotateAroundY(
  [x, y, z]: [number, number, number],
  radians: number,
) {
  return normalize([
    x * Math.cos(radians) + z * Math.sin(radians),
    y,
    -x * Math.sin(radians) + z * Math.cos(radians),
  ]);
}
```

`buildCelestialSnapshot()`：

```typescript
export function buildCelestialSnapshot(date: Date): CelestialSnapshot {
  if (Number.isNaN(date.getTime())) {
    throw new Error("星空需要有效日期");
  }

  const dateRotation = Rotation_EQJ_EQD(date).rot;
  const sunRaw = GeoVector(Body.Sun, date, true);
  const moonRaw = GeoVector(Body.Moon, date, true);
  const sunDate = rotateWithMatrix(
    dateRotation,
    [sunRaw.x, sunRaw.y, sunRaw.z],
  );
  const moonDate = rotateWithMatrix(
    dateRotation,
    [moonRaw.x, moonRaw.y, moonRaw.z],
  );
  const sunCelestialDirection = astronomyToScene(sunDate);
  const moonCelestialDirection = astronomyToScene(moonDate);
  const moonLight = normalize([
    sunRaw.x - moonRaw.x,
    sunRaw.y - moonRaw.y,
    sunRaw.z - moonRaw.z,
  ]);
  const celestialRotationRadians =
    -2 * Math.PI * (SiderealTime(date) / 24);
  const sunDirectionEarthFixed = rotateAroundY(
    sunCelestialDirection,
    celestialRotationRadians,
  );

  return {
    capturedAt: new Date(date),
    celestialRotationRadians,
    sunDirectionEarthFixed,
    sunCelestialDirection,
    moonCelestialDirection,
    moonLightCelestialDirection: astronomyToScene(
      rotateWithMatrix(dateRotation, moonLight),
    ),
    moonIlluminatedFraction:
      Illumination(Body.Moon, date).phase_fraction,
    starsCelestial: brightStars.map((star) => ({
      id: star.id,
      direction: astronomyToScene(
        rotateWithMatrix(
          dateRotation,
          raDecToEqj(
            star.rightAscensionHours,
            star.declinationDegrees,
          ),
        ),
      ),
      magnitude: star.magnitude,
      colorIndex: star.colorIndex,
    })),
  };
}
```

保留 `solarDirection` 仅用于旧测试的坐标校准，并由新快照传入昼夜着色器。

- [ ] **Step 4: 运行数学测试**

Run: `pnpm exec node --test tests/celestial.test.mjs`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add XHBlogs/lib/celestial.ts XHBlogs/tests/celestial.test.mjs
git commit -m "feat: calculate real celestial positions"
```

---

### Task 3: 渲染亮星点云

**Files:**
- Create: `XHBlogs/components/CelestialSphere.tsx`
- Modify: `XHBlogs/components/TravelGlobe.tsx`

**Interfaces:**

```typescript
interface CelestialSphereProps {
  snapshot: CelestialSnapshot;
}
```

- [ ] **Step 1: 添加集成测试**

在 `XHBlogs/tests/celestial.test.mjs` 添加：

```javascript
test("mounts the celestial sphere with depth-tested points", () => {
  const celestial = fs.readFileSync(
    path.join(root, "components", "CelestialSphere.tsx"),
    "utf8",
  );
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );

  assert.match(celestial, /THREE\.Points/);
  assert.match(celestial, /gl_PointSize/);
  assert.match(celestial, /depthTest/);
  assert.match(globe, /CelestialSphere/);
  assert.match(globe, /buildCelestialSnapshot/);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm exec node --test --test-name-pattern="depth-tested points" tests/celestial.test.mjs`

Expected: FAIL；`CelestialSphere.tsx` 尚不存在。

- [ ] **Step 3: 实现星点组件**

常量：

```typescript
const STAR_SPHERE_RADIUS = 12;
const SIDEREAL_RADIANS_PER_SECOND =
  (2 * Math.PI) / 86_164.0905;
```

`StarField`：

- 为 50 颗恒星创建 `THREE.BufferGeometry`。
- `position` 属性使用 `direction * STAR_SPHERE_RADIUS`。
- `color` 按 B-V：小于 `0.3` 偏蓝白，大于 `1.1` 偏暖黄，其余近白。
- `size` 属性按视星等生成，最大约 `3px`，最暗约 `1.8px`。
- 使用自定义 `ShaderMaterial`：

```glsl
attribute float size;
attribute vec3 color;
varying vec3 vColor;

void main() {
  vColor = color;
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size;
  gl_Position = projectionMatrix * viewPosition;
}
```

```glsl
varying vec3 vColor;

void main() {
  vec2 point = gl_PointCoord * 2.0 - 1.0;
  float radius = length(point);
  if (radius > 1.0) discard;
  float alpha = 1.0 - smoothstep(0.18, 1.0, radius);
  gl_FragColor = vec4(vColor, alpha);
}
```

材质参数：

```typescript
new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true,
  depthTest: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
```

几何体或材质变化时释放旧 GPU 资源：

```tsx
useEffect(
  () => () => {
    geometry.dispose();
    material.dispose();
  },
  [geometry, material],
);
```

- [ ] **Step 4: 添加连续恒星时旋转**

`CelestialSphere` 使用一个 `group`：

```tsx
const group = useRef<THREE.Group>(null);

useFrame(() => {
  if (!group.current) return;
  const elapsed =
    (Date.now() - snapshot.capturedAt.getTime()) / 1000;
  group.current.rotation.y =
    snapshot.celestialRotationRadians -
    elapsed * SIDEREAL_RADIANS_PER_SECOND;
});
```

所有恒星、太阳和月亮都放在该组内，因此相机的 OrbitControls 变换和地球深度遮挡自动生效。

- [ ] **Step 5: 运行集成测试与构建**

Run: `pnpm exec node --test --test-name-pattern="depth-tested points" tests/celestial.test.mjs`

Expected: PASS。

Run: `pnpm exec tsc --noEmit`

Expected: exit 0。

- [ ] **Step 6: 提交**

```bash
git add XHBlogs/components/CelestialSphere.tsx XHBlogs/components/TravelGlobe.tsx XHBlogs/tests/celestial.test.mjs
git commit -m "feat: render real bright star field"
```

---

### Task 4: 渲染真实太阳、月亮和月相

**Files:**
- Modify: `XHBlogs/components/CelestialSphere.tsx`
- Modify: `XHBlogs/components/TravelGlobe.tsx`
- Modify: `XHBlogs/tests/celestial.test.mjs`

**Interfaces:**

```typescript
interface CelestialSphereProps {
  snapshot: CelestialSnapshot;
}
```

- [ ] **Step 1: 添加太阳月亮测试**

```javascript
test("renders time-driven sun and phase-lit moon", () => {
  const celestial = fs.readFileSync(
    path.join(root, "components", "CelestialSphere.tsx"),
    "utf8",
  );
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );

  assert.match(celestial, /sunCelestialDirection/);
  assert.match(celestial, /moonCelestialDirection/);
  assert.match(celestial, /moonLightCelestialDirection/);
  assert.match(celestial, /phase_fraction|moonIlluminatedFraction/);
  assert.match(celestial, /moon.*ShaderMaterial|ShaderMaterial.*moon/is);
  assert.match(globe, /sunDirectionEarthFixed/);
  assert.match(globe, /setInterval/);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm exec node --test --test-name-pattern="phase-lit moon" tests/celestial.test.mjs`

Expected: FAIL；太阳、月亮渲染和动态快照尚未接入。

- [ ] **Step 3: 实现太阳**

常量：

```typescript
const SUN_DISTANCE = 8;
const SUN_CORE_RADIUS = 0.15;
```

渲染：

- 在 `sunCelestialDirection * SUN_DISTANCE` 放置太阳组。
- 使用暖白 `MeshBasicMaterial` 球核。
- 使用两层透明加色球壳形成柔光。
- `depthTest: true`、`depthWrite: false`。
- 太阳方向不跟随屏幕；只由天球组和相机变换。

- [ ] **Step 4: 实现月亮与真实月相**

常量：

```typescript
const MOON_DISTANCE = 5.5;
const MOON_RADIUS = 0.12;
```

月亮顶点着色器输出局部法线。片元着色器：

```glsl
uniform vec3 sunDirection;
varying vec3 vNormal;

void main() {
  float light = smoothstep(
    -0.08,
    0.16,
    dot(normalize(vNormal), normalize(sunDirection))
  );
  vec3 darkSide = vec3(0.055, 0.065, 0.08);
  vec3 litSide = vec3(0.92, 0.9, 0.82);
  gl_FragColor = vec4(mix(darkSide, litSide, light), 1.0);
}
```

材质设置：

```typescript
new THREE.ShaderMaterial({
  uniforms: {
    sunDirection: {
      value: new THREE.Vector3(
        ...snapshot.moonLightCelestialDirection,
      ),
    },
  },
  vertexShader,
  fragmentShader,
  depthTest: true,
  depthWrite: true,
});
```

- [ ] **Step 5: 接入当前时间快照**

在 `TravelScene` 中：

```tsx
const [celestial, setCelestial] = useState(() =>
  buildCelestialSnapshot(new Date()),
);

useEffect(() => {
  if (!active) return;
  const update = () => setCelestial(buildCelestialSnapshot(new Date()));
  const timer = window.setInterval(update, 5_000);
  return () => window.clearInterval(timer);
}, [active]);
```

`active` 来自现有 `pageVisible`。将 `celestial.sunDirectionEarthFixed` 传给 `Earth` 的 `sun` 参数，删除旧的 60 秒 `solarDirection` 计时器。

- [ ] **Step 6: 运行测试**

Run: `pnpm test`

Expected: 全部测试 PASS，无失败输出。

Run: `pnpm exec tsc --noEmit`

Expected: exit 0。

- [ ] **Step 7: 提交**

```bash
git add XHBlogs/components/CelestialSphere.tsx XHBlogs/components/TravelGlobe.tsx XHBlogs/tests/celestial.test.mjs
git commit -m "feat: render real sun and moon"
```

---

### Task 5: 最终集成、浏览器验收与部署

**Files:**
- Modify only if browser verification reveals a defect.

- [ ] **Step 1: 运行完整验证**

Run: `pnpm test`

Expected: 全部测试 PASS。

Run: `pnpm exec tsc --noEmit`

Expected: exit 0。

Run: `pnpm build`

Expected: exit 0，`/footprints` 路由正常生成。

- [ ] **Step 2: 浏览器验收**

打开 `/footprints/` 并确认：

1. 能看到亮星点云。
2. 能看到太阳和月亮；两者没有固定贴在屏幕角落。
3. 拖动地球时，天体产生符合透视的位置变化。
4. 天体转到地球后方时被遮挡。
5. 月亮亮面朝向太阳，不是固定贴图。
6. 等待至少 5 秒，指示器或调试日志显示快照时间变化。
7. 页面没有控制台错误，加载和入场不跳动。

- [ ] **Step 3: 提交修复**

若浏览器验收发现问题，先添加失败测试，再修复并提交：

```bash
git add XHBlogs
git commit -m "fix: polish celestial sky rendering"
```

- [ ] **Step 4: 部署**

通过现有 Cloudflare Pages 工作流部署 `main`，确认 `build`、`deploy`、`Cloudflare Pages` 全部成功。
