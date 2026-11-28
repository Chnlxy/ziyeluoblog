export const CLOUD_TANGENT_EPSILON = 0.0001;
export const CLOUD_RELIEF_START = 0.1;
export const CLOUD_RELIEF_END = 0.7;

export const atmosphereVertexShader = `
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

export const atmosphereFragmentShader = `
  uniform float uHasClouds;
  uniform vec2 uCloudTexel;
  uniform sampler2D cloudMap;
  uniform sampler2D earthDayMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  float cloudMask(vec2 uv) {
    vec3 satelliteColor = texture2D(cloudMap, uv).rgb;
    vec3 groundColor = texture2D(earthDayMap, uv).rgb;
    float satelliteLuma = dot(
      satelliteColor,
      vec3(0.299, 0.587, 0.114)
    );
    float groundLuma = dot(groundColor, vec3(0.299, 0.587, 0.114));
    float spread =
      max(satelliteColor.r, max(satelliteColor.g, satelliteColor.b)) -
      min(satelliteColor.r, min(satelliteColor.g, satelliteColor.b));
    return
      smoothstep(0.05, 0.22, satelliteLuma - groundLuma) *
      (1.0 - smoothstep(0.22, 0.55, spread)) *
      smoothstep(0.015, 0.08, satelliteLuma);
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 sunNormal = normalize(sunDirection);
    vec3 east = normalize(
      vec3(normal.z, 0.0, -normal.x) +
      vec3(${CLOUD_TANGENT_EPSILON}, 0.0, 0.0)
    );
    vec3 north = normalize(cross(normal, east));
    vec2 tangentLight = normalize(
      vec2(dot(sunNormal, east), dot(sunNormal, north)) +
      vec2(${CLOUD_TANGENT_EPSILON})
    );

    float cloud = cloudMask(vUv) * uHasClouds;
    float towardLight =
      cloudMask(vUv + tangentLight * uCloudTexel) * uHasClouds;
    float awayFromLight =
      cloudMask(vUv - tangentLight * uCloudTexel) * uHasClouds;
    float cloudRelief =
      (awayFromLight - towardLight) *
      smoothstep(${CLOUD_RELIEF_START}, ${CLOUD_RELIEF_END}, cloud);

    float sunlight = smoothstep(
      -0.08,
      0.22,
      dot(normal, sunNormal)
    );
    float rim = pow(
      1.0 - max(dot(normal, normalize(vViewDirection)), 0.0),
      3.0
    );

    vec3 nightCloud = vec3(0.15, 0.2, 0.27);
    vec3 dayCloud = vec3(0.93, 0.95, 0.92);
    vec3 cloudColor = mix(nightCloud, dayCloud, sunlight);
    float shadedSlope = smoothstep(0.015, 0.18, -cloudRelief);
    float litSlope = smoothstep(0.015, 0.18, cloudRelief);
    vec3 shadowTint = vec3(0.16, 0.21, 0.28);
    cloudColor = mix(
      cloudColor,
      shadowTint,
      shadedSlope * sunlight * 0.3
    );
    cloudColor = mix(
      cloudColor,
      vec3(1.0),
      litSlope * sunlight * 0.12
    );
    float alpha = cloud * mix(0.045, 0.2, sunlight);
    alpha += rim * mix(0.015, 0.075, sunlight);

    gl_FragColor = vec4(cloudColor, alpha);
  }
`;
