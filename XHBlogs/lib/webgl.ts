interface WebglContextLike {
  getExtension(name: string): {
    loseContext(): void;
  } | null;
}

interface CanvasLike {
  getContext(type: string): WebglContextLike | null;
}

export function detectWebglSupport(
  createCanvas: () => CanvasLike = () =>
    document.createElement("canvas") as unknown as CanvasLike,
) {
  try {
    const canvas = createCanvas();
    const context =
      canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!context) return false;

    try {
      context.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      // Context creation succeeded; cleanup support is optional.
    }
    return true;
  } catch {
    return false;
  }
}
