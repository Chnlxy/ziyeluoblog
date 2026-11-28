import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { brightStars } from "../data/brightStars.ts";
import { buildCelestialSnapshot } from "../lib/celestial.ts";
import {
  cloudReliefAmount,
  tangentLightDirection,
} from "../lib/cloudRelief.ts";
import {
  gibsCloudMapUrl,
  latestCloudObservationDate,
} from "../lib/earthClouds.ts";
import { solarDirection } from "../lib/travel.ts";

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

test("renders the celestial sphere in the globe scene", () => {
  const celestialPath = path.join(
    root,
    "components",
    "CelestialSphere.tsx",
  );
  assert.ok(fs.existsSync(celestialPath));

  const celestial = fs.readFileSync(celestialPath, "utf8");
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );

  assert.match(celestial, /THREE\.Points/);
  assert.match(celestial, /gl_PointSize/);
  assert.match(celestial, /depthTest/);
  assert.match(celestial, /sunCelestialDirection/);
  assert.match(celestial, /moonCelestialDirection/);
  assert.match(celestial, /moonLightCelestialDirection/);
  assert.match(celestial, /ShaderMaterial/);
  assert.match(
    celestial,
    /1\.0 - smoothstep\(0\.18, 1\.0, radius\)/,
  );
  assert.match(celestial, /geometry\.dispose\(\)/);
  assert.match(celestial, /material\.dispose\(\)/);
  assert.match(globe, /CelestialSphere/);
  assert.match(globe, /buildCelestialSnapshot/);
  assert.match(globe, /sunDirectionEarthFixed/);
  assert.match(globe, /setInterval/);
  assert.match(globe, /matchMedia\("\(min-width: 768px\)"\)/);
  assert.doesNotMatch(globe, /const mobile = size\.width < 768/);
  assert.match(
    globe,
    /className="relative h-full w-full overflow-hidden rounded-\[2rem\]"/,
  );
});

test("adds a desktop-only atmospheric cloud layer", () => {
  const atmospherePath = path.join(
    root,
    "components",
    "EarthAtmosphere.tsx",
  );
  assert.ok(fs.existsSync(atmospherePath));

  const atmosphere = fs.readFileSync(atmospherePath, "utf8");
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );

  assert.match(atmosphere, /cloudMap/);
  assert.match(atmosphere, /earthDayMap/);
  assert.match(atmosphere, /RepeatWrapping/);
  assert.match(atmosphere, /uHasClouds/);
  assert.match(atmosphere, /earthDayTexture/);
  assert.doesNotMatch(atmosphere, /earthDayUrl/);
  assert.doesNotMatch(atmosphere, /loadTexture\(earthDay/);
  assert.doesNotMatch(atmosphere, /fbm|fractalNoise/);
  assert.match(atmosphere, /transparent/);
  assert.match(atmosphere, /depthWrite:\s*false/);
  assert.match(atmosphere, /sunDirection/);
  assert.match(atmosphere, /renderOrder=\{-1\}/);
  assert.match(
    globe,
    /desktopTextures &&\s*activeEarthDayTexture && \([\s\S]*<EarthAtmosphere[\s\S]*earthDayTexture=\{activeEarthDayTexture\}/,
  );
  assert.match(globe, /onDayTextureReady=\{handleDayTextureReady\}/);
});

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

test("points cloud relief toward the local sun direction", () => {
  const east = tangentLightDirection([0, 0, 1], [1, 0, 0]);
  const north = tangentLightDirection([0, 0, 1], [0, 1, 0]);

  assert.ok(east[0] > 0.9999);
  assert.ok(Math.abs(east[1]) < 0.0002);
  assert.ok(Math.abs(north[0]) < 0.0002);
  assert.ok(north[1] > 0.9999);
});

test("keeps cloud relief normalized at the sphere poles", () => {
  const direction = tangentLightDirection([0, 1, 0], [1, 0, 0]);

  assert.ok(Math.abs(Math.hypot(...direction) - 1) < 1e-6);
  assert.ok(direction[0] > 0.999);
});

test("darkens slopes that rise toward the sun and lifts opposite slopes", () => {
  assert.ok(Math.abs(cloudReliefAmount(0.7, 0.8, 0.4) + 0.4) < 1e-12);
  assert.ok(Math.abs(cloudReliefAmount(0.7, 0.4, 0.8) - 0.4) < 1e-12);
  assert.ok(Math.abs(cloudReliefAmount(0.1, 0.8, 0.4)) < 1e-12);
});

test("selects the latest complete UTC observation day", () => {
  assert.equal(
    latestCloudObservationDate(new Date("2026-11-28T00:01:00Z")),
    "2026-11-26",
  );
  assert.equal(
    latestCloudObservationDate(new Date("2026-12-01T23:59:00Z")),
    "2026-11-29",
  );
});

test("builds a global NASA GIBS cloud-map request", () => {
  const url = gibsCloudMapUrl(new Date("2026-11-28T12:00:00Z"));

  assert.match(
    url,
    /VIIRS_NOAA20_CorrectedReflectance_TrueColor/,
  );
  assert.match(url, /TIME=2026-11-26/);
  assert.match(url, /CRS=EPSG%3A4326/);
  assert.match(url, /BBOX=-90%2C-180%2C90%2C180/);
  assert.match(url, /WIDTH=2048/);
  assert.match(url, /HEIGHT=1024/);
  assert.match(url, /FORMAT=image%2Fjpeg/);
});
