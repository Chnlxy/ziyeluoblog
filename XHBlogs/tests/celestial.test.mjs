import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { brightStars } from "../data/brightStars.ts";
import { buildCelestialSnapshot } from "../lib/celestial.ts";
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
  assert.match(
    globe,
    /className="relative h-full w-full overflow-hidden rounded-\[2rem\]"/,
  );
});
