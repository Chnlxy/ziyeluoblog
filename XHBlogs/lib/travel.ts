export interface TravelVisit {
  date: string;
  endDate?: string;
  datePrecision?: "day" | "month";
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

export interface TravelFallbackPlace {
  id: string;
  name: string;
  country: string;
  latestVisitDate: string;
  latestVisitPrecision: "day" | "month";
  photoCount: number;
}

export const hangzhouHome = {
  name: "杭州",
  coordinates: [120.1551, 30.2741] as const,
};

export const ROUTE_FADE_DURATION_SECONDS = 0.45;

const idPattern = /^[a-z0-9-]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: string) {
  if (!datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function formatTravelDate(
  value: string,
  precision: "day" | "month" = "day",
) {
  const [year, month, day] = value
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return value;
  if (precision === "month") return `${year}年${month}月`;
  return `${year}年${month}月${day}日`;
}

export function formatTravelVisitRange(
  visit: Pick<TravelVisit, "date" | "endDate" | "datePrecision">,
) {
  const precision = visit.datePrecision || "day";
  const start = formatTravelDate(visit.date, precision);
  return visit.endDate
    ? `${start} — ${formatTravelDate(visit.endDate, precision)}`
    : start;
}

function validPhoto(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return false;
  if (value.startsWith("/") && !value.startsWith("//")) {
    return !/[<>]/.test(value);
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function validatePlace(place: TravelPlace, index: number) {
  const prefix = `第 ${index + 1} 个地点`;
  if (!place || typeof place !== "object") {
    throw new Error(`${prefix}格式无效`);
  }
  if (typeof place.id !== "string" || !idPattern.test(place.id)) {
    throw new Error(`${prefix}的 id 无效`);
  }
  if (typeof place.name !== "string" || !place.name.trim()) {
    throw new Error(`${prefix}的名称不能为空`);
  }
  if (typeof place.country !== "string" || !place.country.trim()) {
    throw new Error(`${prefix}的国家或地区不能为空`);
  }

  const [longitude, latitude] = place.coordinates || [];
  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(`${prefix}的经度必须在 -180 到 180 之间`);
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error(`${prefix}的纬度必须在 -90 到 90 之间`);
  }
  if (!Array.isArray(place.visits) || place.visits.length === 0) {
    throw new Error(`${prefix}至少需要一条到访记录`);
  }

  for (const visit of place.visits) {
    if (!visit || typeof visit !== "object" || !validDate(visit.date)) {
      throw new Error(`${prefix}的到访日期无效`);
    }
    if (visit.note !== undefined && typeof visit.note !== "string") {
      throw new Error(`${prefix}的旅行备注格式无效`);
    }
    if (
      visit.datePrecision !== undefined &&
      !["day", "month"].includes(visit.datePrecision)
    ) {
      throw new Error(`${prefix}的日期精度无效`);
    }
    if (visit.endDate) {
      if (!validDate(visit.endDate)) {
        throw new Error(`${prefix}的结束日期无效`);
      }
      if (visit.endDate < visit.date) {
        throw new Error(`${prefix}的结束日期不能早于开始日期`);
      }
    }
    if (!Array.isArray(visit.photos) || !visit.photos.every(validPhoto)) {
      throw new Error(`${prefix}的照片地址无效`);
    }
  }
}

export function validateTravelPlaces(places: TravelPlace[]): void {
  if (!Array.isArray(places) || places.length === 0) {
    throw new Error("旅行地点不能为空");
  }

  const ids = new Set<string>();
  places.forEach((place, index) => {
    validatePlace(place, index);
    if (ids.has(place.id)) {
      throw new Error(`旅行地点 id 重复：${place.id}`);
    }
    ids.add(place.id);
  });
}

export function buildTravelFallbackPlaces(
  places: TravelPlace[],
): TravelFallbackPlace[] {
  try {
    validateTravelPlaces(places);
  } catch {
    return [];
  }

  return places.map((place) => {
    const latestVisit = [...place.visits].sort((left, right) =>
      right.date.localeCompare(left.date),
    )[0];
    return {
      id: place.id,
      name: place.name,
      country: place.country,
      latestVisitDate: latestVisit.date,
      latestVisitPrecision: latestVisit.datePrecision || "day",
      photoCount: place.visits.reduce(
        (total, visit) => total + visit.photos.length,
        0,
      ),
    };
  });
}

export function routeFadeOpacity(elapsedSeconds: number) {
  return Math.max(
    0,
    Math.min(
      1,
      1 -
        Math.max(0, elapsedSeconds) / ROUTE_FADE_DURATION_SECONDS,
    ),
  );
}

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

function dot(
  left: [number, number, number],
  right: [number, number, number],
) {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function normalize(point: [number, number, number]): [number, number, number] {
  const length = Math.hypot(...point) || 1;
  return point.map((value) => value / length) as [
    number,
    number,
    number,
  ];
}

function cross(
  left: [number, number, number],
  right: [number, number, number],
): [number, number, number] {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

function sphereDirection(
  start: [number, number, number],
  end: [number, number, number],
  angle: number,
  amount: number,
): [number, number, number] {
  if (angle < 1e-9) return start;

  let tangent: [number, number, number];
  if (Math.PI - angle < 1e-9) {
    const axis: [number, number, number] =
      Math.abs(start[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    tangent = normalize(cross(start, axis));
  } else {
    const projection = dot(start, end);
    tangent = normalize([
      end[0] - start[0] * projection,
      end[1] - start[1] * projection,
      end[2] - start[2] * projection,
    ]);
  }

  const cosine = Math.cos(angle * amount);
  const sine = Math.sin(angle * amount);
  return normalize([
    start[0] * cosine + tangent[0] * sine,
    start[1] * cosine + tangent[1] * sine,
    start[2] * cosine + tangent[2] * sine,
  ]);
}

export function sampleGreatCircleArc(
  from: [number, number],
  to: [number, number],
  segments = 64,
  height = 0.18,
): Array<[number, number, number]> {
  const safeSegments = Math.min(
    512,
    Math.max(2, Number.isFinite(segments) ? Math.floor(segments) : 64),
  );
  const start = latLngToVector3(from);
  const end = latLngToVector3(to);
  const angle = Math.acos(Math.min(1, Math.max(-1, dot(start, end))));
  const points: Array<[number, number, number]> = [];

  for (let index = 0; index <= safeSegments; index += 1) {
    const amount = index / safeSegments;
    const direction = sphereDirection(start, end, angle, amount);
    const distanceFactor = Math.min(1, angle / (Math.PI / 2));
    const lift =
      height * Math.sin(Math.PI * amount) * distanceFactor;
    points.push(
      direction.map((value) => value * (1 + lift)) as [
        number,
        number,
        number,
      ],
    );
  }
  return points;
}

export function cameraPositionForRoute(
  from: [number, number],
  to: [number, number],
  distance = 3.2,
): [number, number, number] {
  const start = latLngToVector3(from);
  const end = latLngToVector3(to);
  const midpoint = normalize([
    start[0] + end[0],
    start[1] + end[1],
    start[2] + end[2],
  ]);
  const midpointLength = Math.hypot(
    start[0] + end[0],
    start[1] + end[1],
    start[2] + end[2],
  );
  const direction = midpointLength < 1e-9 ? end : midpoint;
  return direction.map((value) => value * distance) as [
    number,
    number,
    number,
  ];
}

export function solarDirection(date: Date): [number, number, number] {
  if (Number.isNaN(date.getTime())) {
    throw new Error("太阳方向需要有效日期");
  }

  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear =
    (date.getTime() - yearStart) / 86_400_000 + 1;
  const declination =
    23.44 *
    Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365);
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3_600_000;
  const longitude = 180 - utcHours * 15;

  return normalize(latLngToVector3([longitude, declination]));
}

export function isMarkerFrontFacing(
  markerPosition: [number, number, number],
  cameraPosition: [number, number, number],
) {
  const normal = normalize(markerPosition);
  return (
    dot(normal, [
      cameraPosition[0] - markerPosition[0],
      cameraPosition[1] - markerPosition[1],
      cameraPosition[2] - markerPosition[2],
    ]) > 0
  );
}

export function markerHorizonVisibility(
  markerPosition: [number, number, number],
  cameraPosition: [number, number, number],
  beamTipOffset: number,
  capRadius: number,
) {
  const normal = normalize(markerPosition);
  const beamTipRadius = Math.hypot(...markerPosition) + beamTipOffset;
  const tipPosition = normal.map(
    (value) => value * beamTipRadius,
  ) as [number, number, number];
  const cameraLength = Math.hypot(...cameraPosition);
  const centerHorizon = dot(cameraPosition, tipPosition) - 1;
  const capProjection = capRadius * cameraLength;

  return centerHorizon + capProjection > 0 ? 1 : 0;
}
