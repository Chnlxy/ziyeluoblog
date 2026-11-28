"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

import {
  cloudCrossfadeProgress,
  gibsCloudMapUrl,
} from "../lib/earthClouds";
import {
  atmosphereFragmentShader,
  atmosphereVertexShader,
} from "../lib/earthAtmosphereShader";

export const FALLBACK_CLOUD_MAP =
  "/images/globe/clouds-fallback.jpg";

function configureTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
}

function textureTexel(texture: THREE.Texture) {
  const image = texture.image as
    | { width?: number; height?: number }
    | undefined;
  return new THREE.Vector2(
    1 / (image?.width ?? 2048),
    1 / (image?.height ?? 1024),
  );
}

export default function EarthAtmosphere({
  sun,
  earthDayTexture,
  onReady,
}: {
  sun: [number, number, number];
  earthDayTexture: THREE.Texture;
  onReady: () => void;
}) {
  const fallbackCloudTexture = useLoader(
    THREE.TextureLoader,
    FALLBACK_CLOUD_MAP,
  );
  const activeFallbackCloudTexture = useMemo(() => {
    configureTexture(fallbackCloudTexture);
    return fallbackCloudTexture;
  }, [fallbackCloudTexture]);
  const blendStartedAt = useRef<number | null>(null);
  const resources = useMemo(() => {
    const placeholderLiveCloud = new THREE.DataTexture(
      new Uint8Array([0, 0, 0, 0]),
      1,
      1,
    );
    placeholderLiveCloud.needsUpdate = true;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uHasClouds: { value: 1 },
        uHasLiveClouds: { value: 0 },
        uCloudBlend: { value: 0 },
        uCloudTexel: { value: textureTexel(activeFallbackCloudTexture) },
        cloudMap: { value: activeFallbackCloudTexture },
        liveCloudMap: { value: placeholderLiveCloud },
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

    return { material, placeholderLiveCloud };
  }, [activeFallbackCloudTexture, earthDayTexture]);
  const { material, placeholderLiveCloud } = resources;

  useEffect(() => {
    onReady();
  }, [onReady]);

  useFrame(() => {
    if (blendStartedAt.current === null) return;
    const progress = cloudCrossfadeProgress(
      (performance.now() - blendStartedAt.current) / 1000,
    );
    material.uniforms.uCloudBlend.value = progress;
    if (progress >= 1) blendStartedAt.current = null;
  });

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
        material.uniforms.uCloudTexel.value.copy(textureTexel(texture));
        material.uniforms.liveCloudMap.value = texture;
        material.uniforms.uHasLiveClouds.value = 1;
        blendStartedAt.current = performance.now();
      },
      undefined,
      () => {
        // Keep the bundled local cloud map if NASA is offline.
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
      placeholderLiveCloud.dispose();
    },
    [material, placeholderLiveCloud],
  );

  return (
    <mesh scale={1.006} renderOrder={-1}>
      <sphereGeometry args={[1, 96, 96]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
