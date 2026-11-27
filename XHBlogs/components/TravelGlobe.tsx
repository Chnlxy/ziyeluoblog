"use client";

import {
  type ComponentRef,
  type RefObject,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, ThreeEvent, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import {
  type TravelPlace,
  advanceMarkerOpacity,
  cameraPositionForRoute,
  hangzhouHome,
  latLngToVector3,
  markerHorizonVisibility,
  routeFadeOpacity,
  sampleGreatCircleArc,
  solarDirection,
} from "../lib/travel";

const EARTH_DAY = "/images/globe/earth-day.jpg";
const EARTH_NIGHT = "/images/globe/earth-night.jpg";
const EARTH_DAY_MOBILE = "/images/globe/earth-day-mobile.jpg";
const EARTH_NIGHT_MOBILE = "/images/globe/earth-night-mobile.jpg";
const MARKER_BEAM_HEIGHT = 0.07;
const MARKER_CAP_RADIUS = 0.018;
const MARKER_SURFACE_RADIUS = 1.003;

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    float sun = dot(normalize(vNormal), normalize(sunDirection));
    float daylight = smoothstep(-0.12, 0.14, sun);
    vec3 dayColor = texture2D(dayMap, vUv).rgb * 1.08;
    vec3 nightColor = texture2D(nightMap, vUv).rgb * 0.78;
    vec3 color = mix(nightColor, dayColor, daylight);
    float twilight = 1.0 - smoothstep(0.0, 0.42, abs(sun));
    color += vec3(0.32, 0.15, 0.035) * twilight * 0.32;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useSceneActive(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let intersecting = true;
    const update = () => setVisible(!document.hidden && intersecting);
    update();
    document.addEventListener("visibilitychange", update);

    const container = containerRef.current;
    const observer =
      container && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              intersecting = entry?.isIntersecting ?? true;
              update();
            },
            { threshold: 0.05 },
          )
        : null;
    if (container && observer) observer.observe(container);

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [containerRef]);

  return visible;
}

function createMarkerLabelTexture(label: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  if (context) {
    context.fillStyle = "rgba(24, 25, 20, 0.9)";
    context.beginPath();
    context.roundRect(8, 20, 496, 88, 44);
    context.fill();
    context.strokeStyle = "rgba(234, 220, 157, 0.85)";
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = "#fff8df";
    context.font =
      '700 42px "Noto Serif SC", "Source Han Serif SC", serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, 256, 64, 448);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function GlobeControls({
  reducedMotion,
  focusTarget,
  onFocusCancelled,
}: {
  reducedMotion: boolean;
  focusTarget: [number, number, number] | null;
  onFocusCancelled: () => void;
}) {
  const [autoRotate, setAutoRotate] = useState(!reducedMotion);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const focusStartedAt = useRef(0);
  const focusVector = useMemo(
    () => (focusTarget ? new THREE.Vector3(...focusTarget) : null),
    [focusTarget],
  );

  useEffect(() => {
    if (focusVector) focusStartedAt.current = performance.now();
  }, [focusVector]);

  useFrame(({ camera }, delta) => {
    if (!focusVector) return;
    const amount = reducedMotion
      ? 1
      : 1 - Math.exp(-Math.min(delta, 0.1) * 4.2);
    camera.position.lerp(focusVector, amount);
    camera.lookAt(0, 0, 0);
    controls.current?.update();
  });

  useEffect(() => {
    setAutoRotate(!reducedMotion);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, [reducedMotion]);

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      minDistance={2.35}
      maxDistance={4.1}
      autoRotate={autoRotate && !focusVector}
      autoRotateSpeed={0.22}
      rotateSpeed={0.55}
      zoomSpeed={0.75}
      onStart={() => {
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        setAutoRotate(false);
        if (
          focusVector &&
          performance.now() - focusStartedAt.current > 250
        ) {
          onFocusCancelled();
        }
      }}
      onEnd={() => {
        if (reducedMotion) return;
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => setAutoRotate(true), 4000);
      }}
    />
  );
}

function Earth({
  sun,
  onReady,
}: {
  sun: [number, number, number];
  onReady: () => void;
}) {
  const { size } = useThree();
  const mobile = size.width < 768;
  const [dayMap, nightMap] = useLoader(THREE.TextureLoader, [
    mobile ? EARTH_DAY_MOBILE : EARTH_DAY,
    mobile ? EARTH_NIGHT_MOBILE : EARTH_NIGHT,
  ]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          dayMap: { value: dayMap },
          nightMap: { value: nightMap },
          sunDirection: { value: new THREE.Vector3(...sun) },
        },
        vertexShader,
        fragmentShader,
      }),
    [dayMap, nightMap],
  );

  useEffect(() => {
    for (const texture of [dayMap, nightMap]) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = mobile ? 2 : 4;
    }
    onReady();
  }, [dayMap, mobile, nightMap, onReady]);

  useEffect(() => {
    material.uniforms.sunDirection.value.set(...sun);
  }, [material, sun]);

  useEffect(() => () => material.dispose(), [material]);

  const segments = size.width < 768 ? 64 : 96;

  return (
    <mesh>
      <sphereGeometry args={[1, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

interface MarkerProps {
  id: string;
  label: string;
  coordinates: [number, number];
  radius: number;
  selected: boolean;
  focused: boolean;
  selectable: boolean;
  onSelect?: (id: string) => void;
}

function Marker({
  id,
  label,
  coordinates,
  radius,
  selected,
  focused,
  selectable,
  onSelect,
}: MarkerProps) {
  const group = useRef<THREE.Group>(null);
  const baseMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const beamMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const capMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const labelMaterial = useRef<THREE.SpriteMaterial>(null);
  const opacity = useRef(0);
  const [hovered, setHovered] = useState(false);
  const wasVisible = useRef(false);
  const position = useMemo(
    () => new THREE.Vector3(...latLngToVector3(coordinates, radius)),
    [coordinates, radius],
  );
  const labelTexture = useMemo(
    () => createMarkerLabelTexture(label),
    [label],
  );
  const normal = useMemo(
    () => position.clone().normalize(),
    [position],
  );
  const orientation = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        normal,
      ),
    [normal],
  );

  useFrame(({ camera }, delta) => {
    if (!group.current) return;
    const markerScale =
      Math.max(0.75, camera.position.length() / 3.2) *
      (selected || focused ? 1.22 : 1);
    const capVisible =
      markerHorizonVisibility(
        [position.x, position.y, position.z],
        [camera.position.x, camera.position.y, camera.position.z],
        MARKER_BEAM_HEIGHT * markerScale,
        MARKER_CAP_RADIUS * markerScale,
      ) > 0;
    opacity.current = advanceMarkerOpacity(
      opacity.current,
      capVisible,
      delta,
    );
    const visibility = opacity.current;
    const visible = capVisible || visibility > 0;
    group.current.visible = visible;
    if (wasVisible.current !== visible) {
      wasVisible.current = visible;
      if (!visible) {
        setHovered(false);
        if (document.body.style.cursor === "pointer") {
          document.body.style.cursor = "";
        }
      }
    }
    group.current.scale.setScalar(markerScale);

    const interactiveOpacity = hovered || focused || selected ? 1 : 0.8;
    if (baseMaterial.current) {
      baseMaterial.current.opacity = visibility * interactiveOpacity;
    }
    if (beamMaterial.current) {
      beamMaterial.current.opacity = visibility * interactiveOpacity * 0.9;
    }
    if (capMaterial.current) {
      capMaterial.current.opacity = visibility * interactiveOpacity;
    }
    if (labelMaterial.current) {
      labelMaterial.current.opacity = visibility * interactiveOpacity;
    }
  });

  useEffect(
    () => () => {
      labelTexture.dispose();
      if (document.body.style.cursor === "pointer") {
        document.body.style.cursor = "";
      }
    },
    [labelTexture],
  );

  const color =
    selected || focused
      ? "#fff1ad"
      : selectable
        ? "#e6c56d"
        : "#b4c4a9";

  return (
    <group
      ref={group}
      position={position}
      quaternion={orientation}
    >
      <mesh
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          if (selectable && onSelect) onSelect(id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = selectable ? "pointer" : "default";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[0.012, 14, 14]} />
        <meshBasicMaterial
          ref={baseMaterial}
          color={color}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
      <mesh
        position={[0, MARKER_BEAM_HEIGHT / 2, 0]}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          if (selectable && onSelect) onSelect(id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = selectable ? "pointer" : "default";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
      >
        <cylinderGeometry
          args={[0.006, 0.011, MARKER_BEAM_HEIGHT, 10, 1, true]}
        />
        <meshBasicMaterial
          ref={beamMaterial}
          color={color}
          transparent
          opacity={0.72}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh
        position={[0, MARKER_BEAM_HEIGHT, 0]}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          if (selectable && onSelect) onSelect(id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = selectable ? "pointer" : "default";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[MARKER_CAP_RADIUS, 16, 16]} />
        <meshBasicMaterial
          ref={capMaterial}
          color={color}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
      <sprite
        position={[0, MARKER_BEAM_HEIGHT + 0.07, 0]}
        scale={[0.32, 0.08, 1]}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          if (selectable && onSelect) onSelect(id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = selectable ? "pointer" : "default";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
      >
        <spriteMaterial
          ref={labelMaterial}
          map={labelTexture}
          transparent
          opacity={0.8}
          depthTest={false}
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}

function TravelRoute({
  destination,
  reducedMotion,
  fading = false,
  onFadeComplete,
}: {
  destination: [number, number];
  reducedMotion: boolean;
  fading?: boolean;
  onFadeComplete?: () => void;
}) {
  const geometry = useMemo(() => {
    const points = sampleGreatCircleArc(
      [...hangzhouHome.coordinates],
      destination,
      96,
      0.18,
    );
    return new THREE.BufferGeometry().setFromPoints(
      points.map((point) => new THREE.Vector3(...point)),
    );
  }, [destination]);
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#f2d77f",
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      }),
    [],
  );
  const line = useMemo(
    () => new THREE.Line(geometry, material),
    [geometry, material],
  );
  const progress = useRef(reducedMotion ? 1 : 0);
  const fadeCompleted = useRef(false);

  useEffect(() => {
    progress.current = reducedMotion ? 1 : 0;
    geometry.setDrawRange(
      0,
      reducedMotion ? geometry.getAttribute("position").count : 0,
    );
  }, [geometry, reducedMotion]);

  useEffect(() => {
    if (!fading) {
      material.opacity = 0.95;
      return;
    }
    if (reducedMotion) {
      material.opacity = 0;
      onFadeComplete?.();
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const animateFade = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      material.opacity = 0.95 * routeFadeOpacity(elapsed);
      if (elapsed < 0.45) {
        frame = window.requestAnimationFrame(animateFade);
      } else if (!fadeCompleted.current) {
        fadeCompleted.current = true;
        onFadeComplete?.();
      }
    };
    frame = window.requestAnimationFrame(animateFade);
    return () => window.cancelAnimationFrame(frame);
  }, [fading, material, onFadeComplete, reducedMotion]);

  useFrame((_, delta) => {
    if (reducedMotion || progress.current >= 1) {
      progress.current = 1;
      geometry.setDrawRange(0, geometry.getAttribute("position").count);
      return;
    }
    progress.current = Math.min(1, progress.current + delta / 0.7);
    const pointCount = geometry.getAttribute("position").count;
    geometry.setDrawRange(
      0,
      Math.max(2, Math.floor(pointCount * progress.current)),
    );
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <primitive object={line} />;
}

function TravelScene({
  places,
  selectedId,
  focusedId,
  onSelect,
  onTexturesReady,
}: {
  places: TravelPlace[];
  selectedId: string | null;
  focusedId: string | null;
  onSelect: (id: string | null) => void;
  onTexturesReady: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [sun, setSun] = useState(() => solarDirection(new Date()));

  useEffect(() => {
    const update = () => setSun(solarDirection(new Date()));
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);

  const selected = places.find((place) => place.id === selectedId) || null;
  const focused = places.find((place) => place.id === focusedId) || null;
  const [focusCancelled, setFocusCancelled] = useState(false);
  const [outgoingRoute, setOutgoingRoute] = useState<{
    key: string;
    destination: [number, number];
  } | null>(null);
  const previousSelected = useRef<TravelPlace | null>(null);

  useEffect(() => {
    setFocusCancelled(false);
  }, [focusedId, selectedId]);

  useLayoutEffect(() => {
    const previous = previousSelected.current;
    if (previous && previous.id !== selected?.id) {
      setOutgoingRoute({
        key: `${previous.id}-${performance.now()}`,
        destination: previous.coordinates,
      });
    }
    previousSelected.current = selected;
  }, [selected]);

  const focusTarget = useMemo(
    () => {
      if (focusCancelled) return null;
      if (selected) {
        return cameraPositionForRoute(
          [...hangzhouHome.coordinates],
          selected.coordinates,
        );
      }
      if (focused) return latLngToVector3(focused.coordinates, 3.2);
      return null;
    },
    [focusCancelled, focused, selected],
  );

  return (
    <>
      <GlobeControls
        reducedMotion={reducedMotion}
        focusTarget={focusTarget}
        onFocusCancelled={() => setFocusCancelled(true)}
      />
      <Suspense fallback={null}>
        <Earth sun={sun} onReady={onTexturesReady} />
      </Suspense>
      <Marker
        id="hangzhou"
        label="杭州 · 起点"
        coordinates={[...hangzhouHome.coordinates]}
        radius={MARKER_SURFACE_RADIUS}
        selected={false}
        focused={false}
        selectable={false}
      />
      {places.map((place) => (
        <Marker
          key={place.id}
          id={place.id}
          label={`${place.name} · ${place.country}`}
          coordinates={place.coordinates}
          radius={MARKER_SURFACE_RADIUS}
          selected={place.id === selectedId}
          focused={place.id === focusedId}
          selectable
          onSelect={onSelect}
        />
      ))}
      {selected && (
        <TravelRoute
          key={selected.id}
          destination={selected.coordinates}
          reducedMotion={reducedMotion}
        />
      )}
      {outgoingRoute && (
        <TravelRoute
          key={outgoingRoute.key}
          destination={outgoingRoute.destination}
          reducedMotion={reducedMotion}
          fading
          onFadeComplete={() => setOutgoingRoute(null)}
        />
      )}
    </>
  );
}

export default function TravelGlobe({
  places,
  selectedId,
  onSelect,
}: {
  places: TravelPlace[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageVisible = useSceneActive(containerRef);
  const [maxDpr, setMaxDpr] = useState(1.5);
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  const [texturesReady, setTexturesReady] = useState(false);
  const handleTexturesReady = useCallback(() => {
    setTexturesReady(true);
  }, []);

  useEffect(() => {
    const update = () => setMaxDpr(window.innerWidth < 768 ? 1.5 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Canvas
        className={`globe-canvas ${
          texturesReady ? "globe-canvas--ready" : "opacity-0"
        }`}
        aria-label="旅行足迹地球"
        camera={{ position: [0, 0.6, 3.2], fov: 42 }}
        dpr={[1, maxDpr]}
        frameloop={pageVisible ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => onSelect(null)}
        style={{ touchAction: "none" }}
      >
        <TravelScene
          places={places}
          selectedId={selectedId}
          focusedId={focusedPlaceId}
          onSelect={onSelect}
          onTexturesReady={handleTexturesReady}
        />
      </Canvas>
      <div
        aria-live="polite"
        aria-hidden={texturesReady}
        className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#1b1c18]/35 text-sm font-bold text-slate-200 backdrop-blur-sm transition-opacity duration-500 motion-reduce:transition-none ${
          texturesReady ? "opacity-0" : "opacity-100"
        }`}
      >
        正在加载地球纹理……
      </div>
      <div className="sr-only" aria-label="地点列表">
        <p>杭州 · 起点</p>
        {places.map((place) => (
          <button
            key={place.id}
            type="button"
            data-place-id={place.id}
            aria-current={place.id === selectedId ? "true" : undefined}
            onFocus={() => setFocusedPlaceId(place.id)}
            onBlur={() =>
              setFocusedPlaceId((current) =>
                current === place.id ? null : current,
              )
            }
            onClick={() => onSelect(place.id)}
          >
            {place.name} · {place.country}
          </button>
        ))}
      </div>
    </div>
  );
}
