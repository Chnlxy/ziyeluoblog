export interface MarkerLabelRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface MarkerLabelCandidate {
  id: string;
  priority: number;
  eligible: boolean;
  rect: MarkerLabelRect;
}

export const HOME_LABEL_PRIORITY = 100;
export const SELECTED_LABEL_PRIORITY = Number.MAX_SAFE_INTEGER;

const HOME_MARKER_COLOR = "#b7d7a8";
const CAPITAL_MARKER_COLOR = "#f4ca6a";
const MAJOR_CITY_MARKER_COLOR = "#7dc9e8";
const OTHER_MARKER_COLOR = "#c6a9e8";
const ACTIVE_MARKER_COLOR = "#fff1ad";

type MarkerPriorityTier = "home" | "capital" | "major" | "other";

function markerPriorityTier(priority: number): MarkerPriorityTier {
  if (priority >= 100) return "home";
  if (priority >= 80) return "capital";
  if (priority >= 60) return "major";
  return "other";
}

export function markerPriorityColor(priority: number, active: boolean) {
  if (active) return ACTIVE_MARKER_COLOR;
  const tier = markerPriorityTier(priority);
  if (tier === "home") return HOME_MARKER_COLOR;
  if (tier === "capital") return CAPITAL_MARKER_COLOR;
  if (tier === "major") return MAJOR_CITY_MARKER_COLOR;
  return OTHER_MARKER_COLOR;
}

export function markerPriorityHeight(priority: number) {
  const tier = markerPriorityTier(priority);
  if (tier === "home") return 0.13;
  if (tier === "capital") return 0.11;
  if (tier === "major") return 0.09;
  return 0.07;
}

export function isLabelInteractive(
  layoutVisible: boolean,
  opacity: number,
) {
  return layoutVisible && opacity > 0.01;
}

function overlaps(
  left: MarkerLabelRect,
  right: MarkerLabelRect,
  margin: number,
) {
  return (
    left.left < right.right + margin &&
    left.right + margin > right.left &&
    left.top < right.bottom + margin &&
    left.bottom + margin > right.top
  );
}

export function resolveMarkerLabelVisibility(
  candidates: MarkerLabelCandidate[],
  margin = 4,
) {
  const visibility = Object.fromEntries(
    candidates.map((candidate) => [candidate.id, false]),
  ) as Record<string, boolean>;
  const ordered = candidates
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => candidate.eligible)
    .sort(
      (left, right) =>
        right.candidate.priority - left.candidate.priority ||
        left.index - right.index,
    );
  const kept: MarkerLabelCandidate[] = [];

  for (const { candidate } of ordered) {
    if (
      kept.some((other) =>
        overlaps(candidate.rect, other.rect, margin),
      )
    ) {
      continue;
    }
    visibility[candidate.id] = true;
    kept.push(candidate);
  }

  return visibility;
}

export function advanceLabelLayoutOpacity(
  current: number,
  targetVisible: boolean,
  deltaSeconds: number,
) {
  if (targetVisible) return 1;
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return current;
  }
  const next = current * Math.exp(-deltaSeconds / 0.18);
  return next < 0.01 ? 0 : next;
}
