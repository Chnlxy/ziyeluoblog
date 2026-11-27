"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { CelestialSnapshot } from "../lib/celestial";

const STAR_SPHERE_RADIUS = 12;
const SUN_DISTANCE = 8;
const MOON_DISTANCE = 5.5;
const MOON_RADIUS = 0.11;
const SIDEREAL_RADIANS_PER_SECOND =
  (2 * Math.PI) / 86_164.0905;

const starVertexShader = `
  attribute float pointSize;
  attribute vec3 pointColor;
  uniform float pixelRatio;
  varying vec3 vColor;

  void main() {
    vColor = pointColor;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = pointSize * pixelRatio;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;

  void main() {
    vec2 point = gl_PointCoord * 2.0 - 1.0;
    float radius = length(point);
    if (radius > 1.0) discard;
    float alpha = 1.0 - smoothstep(0.18, 1.0, radius);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const moonVertexShader = `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const moonFragmentShader = `
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
`;

function starColor(colorIndex = 0.65): [number, number, number] {
  if (colorIndex < 0.3) return [0.78, 0.87, 1];
  if (colorIndex > 1.1) return [1, 0.8, 0.57];
  return [1, 0.96, 0.86];
}

function StarField({
  stars,
}: {
  stars: CelestialSnapshot["starsCelestial"];
}) {
  const pixelRatio = useThree((state) => state.gl.getPixelRatio());
  const geometry = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);

    stars.forEach((star, index) => {
      const offset = index * 3;
      positions[offset] = star.direction[0] * STAR_SPHERE_RADIUS;
      positions[offset + 1] = star.direction[1] * STAR_SPHERE_RADIUS;
      positions[offset + 2] = star.direction[2] * STAR_SPHERE_RADIUS;

      const brightness = Math.min(
        1,
        0.65 + Math.max(0, 2.1 - star.magnitude) * 0.15,
      );
      const color = starColor(star.colorIndex);
      colors[offset] = color[0] * brightness;
      colors[offset + 1] = color[1] * brightness;
      colors[offset + 2] = color[2] * brightness;
      sizes[index] = Math.max(
        2,
        4.2 - (star.magnitude + 1.44) * 0.55,
      );
    });

    const next = new THREE.BufferGeometry();
    next.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    next.setAttribute(
      "pointColor",
      new THREE.BufferAttribute(colors, 3),
    );
    next.setAttribute(
      "pointSize",
      new THREE.BufferAttribute(sizes, 1),
    );
    return next;
  }, [stars]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          pixelRatio: { value: pixelRatio },
        },
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [pixelRatio],
  );

  const points = useMemo(
    () => new THREE.Points(geometry, material),
    [geometry, material],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <primitive object={points} frustumCulled={false} />;
}

function Sun({
  direction,
}: {
  direction: [number, number, number];
}) {
  const position = useMemo(
    () =>
      new THREE.Vector3(...direction).multiplyScalar(SUN_DISTANCE),
    [direction],
  );

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshBasicMaterial color="#fff4bd" depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshBasicMaterial
          color="#ffd76e"
          transparent
          opacity={0.24}
          depthTest
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial
          color="#ffb347"
          transparent
          opacity={0.06}
          depthTest
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Moon({
  direction,
  lightDirection,
}: {
  direction: [number, number, number];
  lightDirection: [number, number, number];
}) {
  const position = useMemo(
    () =>
      new THREE.Vector3(...direction).multiplyScalar(MOON_DISTANCE),
    [direction],
  );
  const uniforms = useMemo(
    () => ({
      sunDirection: { value: new THREE.Vector3(...lightDirection) },
    }),
    [lightDirection],
  );

  return (
    <mesh position={position}>
      <sphereGeometry args={[MOON_RADIUS, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={moonVertexShader}
        fragmentShader={moonFragmentShader}
        depthTest
        depthWrite
      />
    </mesh>
  );
}

export default function CelestialSphere({
  snapshot,
}: {
  snapshot: CelestialSnapshot;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const elapsed =
      (Date.now() - snapshot.capturedAt.getTime()) / 1000;
    group.current.rotation.y =
      snapshot.celestialRotationRadians -
      elapsed * SIDEREAL_RADIANS_PER_SECOND;
  });

  return (
    <group ref={group}>
      <StarField stars={snapshot.starsCelestial} />
      <Sun direction={snapshot.sunCelestialDirection} />
      <Moon
        direction={snapshot.moonCelestialDirection}
        lightDirection={snapshot.moonLightCelestialDirection}
      />
    </group>
  );
}
