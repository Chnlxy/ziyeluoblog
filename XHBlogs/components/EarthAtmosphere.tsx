"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const atmosphereVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const atmosphereFragmentShader = `
  uniform float uTime;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  float hash(vec2 point) {
    return fract(
      sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123
    );
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(
        hash(cell),
        hash(cell + vec2(1.0, 0.0)),
        local.x
      ),
      mix(
        hash(cell + vec2(0.0, 1.0)),
        hash(cell + vec2(1.0, 1.0)),
        local.x
      ),
      local.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 5; octave++) {
      value += noise(point) * amplitude;
      point = point * 2.03 + vec2(17.1, 9.2);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 flow = vec2(uTime * 0.002, uTime * 0.0007);
    vec2 cloudUv = vec2(vUv.x * 11.0, vUv.y * 6.0) + flow;
    float broad = fbm(cloudUv);
    float detail = fbm(cloudUv * 2.7 + broad * 1.8);
    float latitude = abs(vUv.y - 0.5) * 2.0;
    float cloud = smoothstep(0.5, 0.76, broad * 0.72 + detail * 0.4);
    cloud *= 1.0 - smoothstep(0.82, 1.0, latitude) * 0.55;

    vec3 normal = normalize(vWorldNormal);
    float sunlight = smoothstep(
      -0.08,
      0.22,
      dot(normal, normalize(sunDirection))
    );
    float rim = pow(
      1.0 - max(dot(normal, normalize(vViewDirection)), 0.0),
      3.0
    );

    vec3 nightCloud = vec3(0.15, 0.2, 0.27);
    vec3 dayCloud = vec3(0.93, 0.95, 0.92);
    vec3 cloudColor = mix(nightCloud, dayCloud, sunlight);
    float alpha = cloud * mix(0.035, 0.19, sunlight);
    alpha += rim * mix(0.015, 0.075, sunlight);

    gl_FragColor = vec4(cloudColor, alpha);
  }
`;

export default function EarthAtmosphere({
  sun,
}: {
  sun: [number, number, number];
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          sunDirection: { value: new THREE.Vector3(...sun) },
        },
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        side: THREE.FrontSide,
        blending: THREE.NormalBlending,
      }),
    [],
  );

  useEffect(() => {
    material.uniforms.sunDirection.value.set(...sun);
  }, [material, sun]);

  useEffect(() => () => material.dispose(), [material]);

  const elapsed = useRef(0);
  useFrame((_, delta) => {
    elapsed.current += delta;
    material.uniforms.uTime.value = elapsed.current;
  });

  return (
    <mesh scale={1.006} renderOrder={-1}>
      <sphereGeometry args={[1, 96, 96]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
