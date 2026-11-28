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
