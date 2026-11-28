"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { gibsCloudMapUrl } from "../lib/earthClouds";

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
  uniform float uHasClouds;
  uniform sampler2D cloudMap;
  uniform sampler2D earthDayMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    vec3 satelliteColor = texture2D(cloudMap, vUv).rgb;
    vec3 groundColor = texture2D(earthDayMap, vUv).rgb;
    float satelliteLuma = dot(
      satelliteColor,
      vec3(0.299, 0.587, 0.114)
    );
    float groundLuma = dot(groundColor, vec3(0.299, 0.587, 0.114));
    float cloudDelta = satelliteLuma - groundLuma;
    float spread =
      max(satelliteColor.r, max(satelliteColor.g, satelliteColor.b)) -
      min(satelliteColor.r, min(satelliteColor.g, satelliteColor.b));
    float cloud =
      smoothstep(0.05, 0.22, cloudDelta) *
      (1.0 - smoothstep(0.22, 0.55, spread)) *
      smoothstep(0.015, 0.08, satelliteLuma);
    cloud *= uHasClouds;

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
    float alpha = cloud * mix(0.045, 0.2, sunlight);
    alpha += rim * mix(0.015, 0.075, sunlight);

    gl_FragColor = vec4(cloudColor, alpha);
  }
`;

function configureTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
}

export default function EarthAtmosphere({
  sun,
  earthDayTexture,
}: {
  sun: [number, number, number];
  earthDayTexture: THREE.Texture;
}) {
  const resources = useMemo(() => {
    const placeholderTexture = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 0]),
      1,
      1,
    );
    placeholderTexture.needsUpdate = true;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uHasClouds: { value: 0 },
        cloudMap: { value: placeholderTexture },
        earthDayMap: { value: earthDayTexture },
        sunDirection: { value: new THREE.Vector3(...sun) },
      },
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.NormalBlending,
    });

    return { material, placeholderTexture };
  }, [earthDayTexture]);
  const { material, placeholderTexture } = resources;

  useEffect(() => {
    material.uniforms.sunDirection.value.set(...sun);
  }, [material, sun]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let cloudTexture: THREE.Texture | null = null;
    let cancelled = false;

    loader.load(
      gibsCloudMapUrl(),
      (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        configureTexture(texture);
        cloudTexture = texture;
        material.uniforms.cloudMap.value = texture;
        material.uniforms.uHasClouds.value = 1;
      },
      undefined,
      () => {
        // Keep the normal-based atmosphere visible if NASA is offline.
      },
    );

    return () => {
      cancelled = true;
      cloudTexture?.dispose();
    };
  }, [material]);

  useEffect(
    () => () => {
      material.dispose();
      placeholderTexture.dispose();
    },
    [material, placeholderTexture],
  );

  return (
    <mesh scale={1.006} renderOrder={-1}>
      <sphereGeometry args={[1, 96, 96]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
