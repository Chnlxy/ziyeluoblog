export const CLOUD_TANGENT_EPSILON = 0.0001;
export const CLOUD_RELIEF_START = 0.1;
export const CLOUD_RELIEF_END = 0.7;

type Vector3 = readonly [number, number, number];

function dot(left: Vector3, right: Vector3) {
  return (
    left[0] * right[0] +
    left[1] * right[1] +
    left[2] * right[2]
  );
}

function normalize3(vector: Vector3): Vector3 {
  const length = Math.hypot(...vector);
  if (length === 0) return [0, 0, 1];
  return [
    vector[0] / length,
    vector[1] / length,
    vector[2] / length,
  ];
}

function cross(left: Vector3, right: Vector3): Vector3 {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

export function tangentLightDirection(
  surfaceNormal: Vector3,
  sunDirection: Vector3,
): [number, number] {
  const normal = normalize3(surfaceNormal);
  const sun = normalize3(sunDirection);
  const east = normalize3([
    normal[2] + CLOUD_TANGENT_EPSILON,
    0,
    -normal[0],
  ]);
  const north = normalize3(cross(normal, east));
  const x = dot(sun, east) + CLOUD_TANGENT_EPSILON;
  const y = dot(sun, north) + CLOUD_TANGENT_EPSILON;
  const length = Math.hypot(x, y);

  return [x / length, y / length];
}

function smoothstep(start: number, end: number, value: number) {
  const amount = Math.min(
    1,
    Math.max(0, (value - start) / (end - start)),
  );
  return amount * amount * (3 - 2 * amount);
}

export function cloudReliefAmount(
  current: number,
  towardLight: number,
  awayFromLight: number,
) {
  const density = smoothstep(
    CLOUD_RELIEF_START,
    CLOUD_RELIEF_END,
    current,
  );
  return (awayFromLight - towardLight) * density;
}
