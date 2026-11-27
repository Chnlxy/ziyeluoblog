import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTravelFallbackPlaces,
  cameraPositionForRoute,
  formatTravelDate,
  formatTravelVisitRange,
  hangzhouHome,
  isMarkerFrontFacing,
  latLngToVector3,
  markerHorizonVisibility,
  routeFadeOpacity,
  sampleGreatCircleArc,
  solarDirection,
  validateTravelPlaces,
} from "../lib/travel.ts";
import { travelPlaces } from "../data/travel.ts";

const tokyo = {
  id: "tokyo",
  name: "东京",
  country: "日本",
  coordinates: [139.6917, 35.6895],
  visits: [
    {
      date: "2026-07-13",
      endDate: "2026-07-23",
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
  assert.throws(
    () =>
      validateTravelPlaces([
        { ...tokyo, coordinates: [0, -91] },
      ]),
    /纬度/,
  );
});

test("rejects empty names and visits", () => {
  assert.throws(
    () => validateTravelPlaces([{ ...tokyo, name: "  " }]),
    /名称/,
  );
  assert.throws(
    () => validateTravelPlaces([{ ...tokyo, visits: [] }]),
    /到访/,
  );
});

test("rejects invalid dates, reversed ranges and unsafe photo URLs", () => {
  assert.throws(
    () =>
      validateTravelPlaces([
        {
          ...tokyo,
          visits: [
            {
              date: "2026-02-30",
              photos: [],
            },
          ],
        },
      ]),
    /日期/,
  );
  assert.throws(
    () =>
      validateTravelPlaces([
        {
          ...tokyo,
          visits: [
            {
              date: "2026-11-25",
              endDate: "2026-11-20",
              photos: [],
            },
          ],
        },
      ]),
    /结束日期/,
  );
  assert.throws(
    () =>
      validateTravelPlaces([
        {
          ...tokyo,
          visits: [
            {
              date: "2026-11-20",
              photos: ["javascript:alert(1)"],
            },
          ],
        },
      ]),
    /照片/,
  );
  assert.throws(
    () =>
      validateTravelPlaces([
        {
          ...tokyo,
          visits: [
            {
              date: "2026-11-20",
              photos: ["//evil.example/image.jpg"],
            },
          ],
        },
      ]),
    /照片/,
  );
});

test("rejects a non-string visit note", () => {
  assert.throws(
    () =>
      validateTravelPlaces([
        {
          ...tokyo,
          visits: [
            {
              date: "2026-07-13",
              note: 42,
              photos: [],
            },
          ],
        },
      ]),
    /备注/,
  );
});

test("rejects an unknown visit date precision", () => {
  assert.throws(
    () =>
      validateTravelPlaces([
        {
          ...tokyo,
          visits: [
            {
              date: "2026-07-13",
              datePrecision: "year",
              photos: [],
            },
          ],
        },
      ]),
    /日期精度/,
  );
});

test("formats month-only and exact-day visits without inventing days", () => {
  assert.equal(
    formatTravelDate("2016-09-01", "month"),
    "2016年9月",
  );
  assert.equal(
    formatTravelDate("2026-11-21", "day"),
    "2026年11月21日",
  );
  assert.equal(
    formatTravelVisitRange({
      date: "2026-07-13",
      endDate: "2026-07-23",
      photos: [],
    }),
    "2026年7月13日 — 2026年7月23日",
  );
});

test("includes the requested travel destinations and month precision", () => {
  const requested = new Map(
    travelPlaces
      .filter((place) =>
        ["bali", "brunei", "osaka", "shanghai"].includes(place.id),
      )
      .map((place) => [place.id, place]),
  );

  assert.deepEqual(
    [...requested.keys()].sort(),
    ["bali", "brunei", "osaka", "shanghai"],
  );
  assert.equal(requested.get("bali").coordinates[0], 115.1889);
  assert.equal(requested.get("bali").coordinates[1], -8.4095);
  assert.equal(requested.get("bali").visits[0].date, "2016-09-01");
  assert.equal(
    requested.get("bali").visits[0].datePrecision,
    "month",
  );
  assert.equal(requested.get("brunei").visits[0].date, "2016-09-01");
  assert.equal(requested.get("osaka").visits[0].date, "2026-07-01");
  assert.equal(requested.get("osaka").visits[0].datePrecision, "month");
  assert.equal(
    requested.get("shanghai").visits[0].date,
    "2026-11-21",
  );
  assert.equal(
    requested.get("shanghai").visits[0].datePrecision,
    "day",
  );
});

test("keeps date precision in fallback location data", () => {
  const bali = travelPlaces.find((place) => place.id === "bali");
  const fallback = buildTravelFallbackPlaces([bali]);

  assert.equal(fallback[0].latestVisitDate, "2016-09-01");
  assert.equal(fallback[0].latestVisitPrecision, "month");
});

test("maps coordinates onto a unit sphere", () => {
  const point = latLngToVector3([0, 0]);
  assert.ok(Math.abs(point[0] - 1) < 1e-9);
  assert.ok(Math.abs(point[1]) < 1e-9);
  assert.ok(Math.abs(point[2]) < 1e-9);

  const northPole = latLngToVector3([0, 90]);
  assert.ok(Math.abs(northPole[0]) < 1e-9);
  assert.ok(Math.abs(northPole[1] - 1) < 1e-9);
  assert.ok(Math.abs(northPole[2]) < 1e-9);
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
    Math.abs(
      Math.hypot(...points[0]) -
        Math.hypot(...latLngToVector3([...hangzhouHome.coordinates])),
    ) < 1e-9,
  );
  assert.ok(
    Math.abs(
      Math.hypot(...points.at(-1)) -
        Math.hypot(...latLngToVector3(tokyo.coordinates)),
    ) < 1e-9,
  );
  assert.ok(
    Math.max(...points.map((point) => Math.hypot(...point))) > 1.01,
  );
});

test("lifts long routes more than short routes", () => {
  const shortLift =
    Math.max(
      ...sampleGreatCircleArc(
        [...hangzhouHome.coordinates],
        tokyo.coordinates,
        32,
        0.18,
      ).map((point) => Math.hypot(...point)),
    ) - 1;
  const longLift =
    Math.max(
      ...sampleGreatCircleArc(
        [...hangzhouHome.coordinates],
        [-74.006, 40.7128],
        32,
        0.18,
      ).map((point) => Math.hypot(...point)),
    ) - 1;

  assert.ok(shortLift > 0);
  assert.ok(longLift > shortLift * 2);
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

test("shows markers only when they face the camera", () => {
  const marker = latLngToVector3([0, 0], 1.025);

  assert.equal(isMarkerFrontFacing(marker, [2.9, 0, 0]), true);
  assert.equal(isMarkerFrontFacing(marker, [-2.9, 0, 0]), false);
});

test("keeps the marker bright until the cap is almost hidden", () => {
  const markerBase = latLngToVector3([0, 0], 1.003);
  const cameraAt = (x) => [x, Math.sqrt(9 - x ** 2), 0];
  const visibilityAt = (x) =>
    markerHorizonVisibility(markerBase, cameraAt(x), 0.07, 0.018);

  assert.equal(visibilityAt(1), 1);
  assert.equal(visibilityAt(0.9), 1);
  const finalFade = visibilityAt(0.885);
  assert.ok(finalFade > 0 && finalFade < 1);
  assert.equal(visibilityAt(0.88), 0);
  assert.equal(visibilityAt(0.87), 0);
  assert.equal(visibilityAt(0), 0);
  assert.equal(
    markerHorizonVisibility(markerBase, [-3, 0, 0], 0.07, 0.018),
    0,
  );
});

test("moves solar longitude across UTC time of day", () => {
  const midnight = solarDirection(new Date("2026-07-13T00:00:00Z"));
  const noon = solarDirection(new Date("2026-07-13T12:00:00Z"));

  assert.ok(Math.hypot(
    midnight[0] - noon[0],
    midnight[1] - noon[1],
    midnight[2] - noon[2],
  ) > 1.5);
  for (const point of [midnight, noon]) {
    assert.ok(point.every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(...point) - 1) < 1e-9);
  }
});

test("keeps antipodal arcs finite with exact endpoints", () => {
  const from = [...hangzhouHome.coordinates];
  const antipode = [-59.8449, -30.2741];
  const points = sampleGreatCircleArc(from, antipode, 64, 0.18);

  assert.ok(points.every((point) => point.every(Number.isFinite)));
  assert.ok(
    Math.abs(Math.hypot(...points[0]) - 1) < 1e-9,
  );
  assert.ok(
    Math.abs(Math.hypot(...points.at(-1)) - 1) < 1e-9,
  );
});

test("places the camera toward the selected travel route", () => {
  const camera = cameraPositionForRoute(
    [...hangzhouHome.coordinates],
    tokyo.coordinates,
    3.2,
  );
  const start = latLngToVector3([...hangzhouHome.coordinates]);
  const end = latLngToVector3(tokyo.coordinates);
  const midpoint = start.map(
    (value, index) => value + end[index],
  );
  const midpointLength = Math.hypot(...midpoint);

  assert.ok(Math.abs(Math.hypot(...camera) - 3.2) < 1e-9);
  assert.ok(
    camera.reduce(
      (sum, value, index) => sum + value * midpoint[index],
      0,
    ) /
      (3.2 * midpointLength) >
      0.999,
  );
});

test("keeps route camera focus finite for identical and antipodal points", () => {
  const identical = cameraPositionForRoute([0, 0], [0, 0], 3.2);
  const antipodal = cameraPositionForRoute([0, 0], [180, 0], 3.2);

  for (const camera of [identical, antipodal]) {
    assert.ok(camera.every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(...camera) - 3.2) < 1e-9);
  }
});

test("builds safe fallback data and returns empty data for invalid visits", () => {
  assert.deepEqual(buildTravelFallbackPlaces([tokyo]), [
    {
      id: "tokyo",
      name: "东京",
      country: "日本",
      latestVisitDate: "2026-07-13",
      latestVisitPrecision: "day",
      photoCount: 1,
    },
  ]);
  assert.deepEqual(
    buildTravelFallbackPlaces([{ ...tokyo, visits: [] }]),
    [],
  );
});

test("fades an outgoing route out over the transition window", () => {
  assert.equal(routeFadeOpacity(0), 1);
  assert.equal(routeFadeOpacity(0.225), 0.5);
  assert.equal(routeFadeOpacity(0.45), 0);
  assert.equal(routeFadeOpacity(1), 0);
});
