"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { gibsCloudMapUrl } from "../lib/earthClouds";
import {
  atmosphereFragmentShader,
  atmosphereVertexShader,
} from "../lib/earthAtmosphereShader";

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
        uCloudTexel: {
          value: new THREE.Vector2(1 / 2048, 1 / 1024),
        },
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
        const image = texture.image as
          | { width?: number; height?: number }
          | undefined;
        material.uniforms.uCloudTexel.value.set(
          1 / (image?.width ?? 2048),
          1 / (image?.height ?? 1024),
        );
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
