const GIBS_WMS_ENDPOINT =
  "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi";

const GIBS_CLOUD_LAYER =
  "VIIRS_NOAA20_CorrectedReflectance_TrueColor";
export const CLOUD_CROSSFADE_SECONDS = 0.5;

function utcDateString(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function latestCloudObservationDate(now = new Date()) {
  const observationDate = new Date(now);
  observationDate.setUTCDate(observationDate.getUTCDate() - 2);
  return utcDateString(observationDate);
}

export function gibsCloudMapUrl(now = new Date()) {
  const parameters = new URLSearchParams({
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: "1.3.0",
    LAYERS: GIBS_CLOUD_LAYER,
    STYLES: "",
    CRS: "EPSG:4326",
    BBOX: "-90,-180,90,180",
    WIDTH: "2048",
    HEIGHT: "1024",
    FORMAT: "image/jpeg",
    TIME: latestCloudObservationDate(now),
  });

  return `${GIBS_WMS_ENDPOINT}?${parameters.toString()}`;
}

export function cloudCrossfadeProgress(elapsedSeconds: number) {
  const progress = Math.max(
    0,
    Math.min(1, elapsedSeconds / CLOUD_CROSSFADE_SECONDS),
  );
  return progress * progress * (3 - 2 * progress);
}
