// Single-image depth is an artistic interpretation, not measured geometry.
// All coordinates refer to the cropped source image, top-left origin.
export const ART_ASPECT = 0.797;
export const CAMERA_Z = 24;
export const ART_WIDTH = 31;
export const ART_HEIGHT = ART_WIDTH / ART_ASPECT;

const smooth = (a, b, v) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function depthAt(u, v) {
  const pond = smooth(0.44, 0.98, v);
  const bank = Math.pow(Math.abs(u - 0.5) * 2, 2);
  const bridgeTop = 0.258 + 0.068 * Math.pow((u - 0.51) * 2, 2);
  const bridgeBottom = bridgeTop + 0.164;
  const bridge = smooth(bridgeTop - 0.012, bridgeTop + 0.016, v)
    * (1 - smooth(bridgeBottom - 0.012, bridgeBottom + 0.018, v));
  const back = -5.5 + bank * 4.3;
  const surface = back * (1 - pond) + (1.5 + 8.5 * pond) * pond;
  return surface * (1 - bridge) + 1.1 * bridge;
}

export function projectArtwork(u, v, extraDepth = 0) {
  const z = depthAt(u, v) + extraDepth;
  const perspective = (CAMERA_Z - z) / CAMERA_Z;
  return [(u - 0.5) * ART_WIDTH * perspective, (0.5 - v) * ART_HEIGHT * perspective, z];
}
