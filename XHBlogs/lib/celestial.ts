import {
  Body,
  GeoVector,
  Illumination,
  Rotation_EQJ_EQD,
  SiderealTime,
} from "astronomy-engine";

import { brightStars } from "../data/brightStars.ts";

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

function normalize(
  vector: [number, number, number],
): [number, number, number] {
  const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length) as [
    number,
    number,
    number,
  ];
}

function astronomyToScene(
  vector: [number, number, number],
): [number, number, number] {
  return [vector[0], vector[2], -vector[1]];
}

function raDecToEqj(
  rightAscensionHours: number,
  declinationDegrees: number,
): [number, number, number] {
  const rightAscension = (rightAscensionHours * Math.PI) / 12;
  const declination = (declinationDegrees * Math.PI) / 180;
  return [
    Math.cos(declination) * Math.cos(rightAscension),
    Math.cos(declination) * Math.sin(rightAscension),
    Math.sin(declination),
  ];
}

function rotateWithMatrix(
  matrix: number[][],
  vector: [number, number, number],
): [number, number, number] {
  return normalize([
    matrix[0][0] * vector[0] +
      matrix[0][1] * vector[1] +
      matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] +
      matrix[1][1] * vector[1] +
      matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] +
      matrix[2][1] * vector[1] +
      matrix[2][2] * vector[2],
  ]);
}

function rotateAroundY(
  [x, y, z]: [number, number, number],
  radians: number,
): [number, number, number] {
  return normalize([
    x * Math.cos(radians) + z * Math.sin(radians),
    y,
    -x * Math.sin(radians) + z * Math.cos(radians),
  ]);
}

export function buildCelestialSnapshot(date: Date): CelestialSnapshot {
  if (Number.isNaN(date.getTime())) {
    throw new Error("星空需要有效日期");
  }

  const dateRotation = Rotation_EQJ_EQD(date).rot;
  const sunRaw = GeoVector(Body.Sun, date, true);
  const moonRaw = GeoVector(Body.Moon, date, true);
  const sunDate = rotateWithMatrix(dateRotation, [
    sunRaw.x,
    sunRaw.y,
    sunRaw.z,
  ]);
  const moonDate = rotateWithMatrix(dateRotation, [
    moonRaw.x,
    moonRaw.y,
    moonRaw.z,
  ]);
  const sunCelestialDirection = astronomyToScene(sunDate);
  const moonCelestialDirection = astronomyToScene(moonDate);
  const moonLight = normalize(
    rotateWithMatrix(dateRotation, [
      sunRaw.x - moonRaw.x,
      sunRaw.y - moonRaw.y,
      sunRaw.z - moonRaw.z,
    ]),
  );
  const celestialRotationRadians =
    -2 * Math.PI * (SiderealTime(date) / 24);

  return {
    capturedAt: new Date(date),
    celestialRotationRadians,
    sunDirectionEarthFixed: rotateAroundY(
      sunCelestialDirection,
      celestialRotationRadians,
    ),
    sunCelestialDirection,
    moonCelestialDirection,
    moonLightCelestialDirection: astronomyToScene(moonLight),
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
