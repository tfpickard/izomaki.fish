import { clamp } from './types';
import type { AttractorState, Attractor, AttractorConfig } from './types';

const CONFIG: AttractorConfig = {
  name: 'aizawa',
  params: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1 },
  dt: 0.01,
  initialState: { x: 0.1, y: 0, z: 0 },
  xRange: [-2, 2],
  yRange: [-2, 2],
  zRange: [-2, 2]
};

export function createAizawa(): Attractor {
  return {
    config: { ...CONFIG },
    step(state: AttractorState, params?: Record<string, number>): AttractorState {
      const a = params?.a ?? CONFIG.params.a;
      const b = params?.b ?? CONFIG.params.b;
      const c = params?.c ?? CONFIG.params.c;
      const d = params?.d ?? CONFIG.params.d;
      const e = params?.e ?? CONFIG.params.e;
      const f = params?.f ?? CONFIG.params.f;
      const dt = CONFIG.dt;
      const dx = ((state.z - b) * state.x - d * state.y) * dt;
      const dy = (d * state.x + (state.z - b) * state.y) * dt;
      const zPart = c + a * state.z - (state.z * state.z * state.z) / 3;
      const xyPart = (state.x * state.x + state.y * state.y) * (1 + e * state.z);
      const dz = (zPart - xyPart + f * state.z * state.x * state.x * state.x) * dt;
      return { x: state.x + dx, y: state.y + dy, z: state.z + dz };
    },
    normalize(state: AttractorState) {
      return {
        nx: clamp((state.x - CONFIG.xRange[0]) / (CONFIG.xRange[1] - CONFIG.xRange[0]), 0, 1),
        ny: clamp((state.y - CONFIG.yRange[0]) / (CONFIG.yRange[1] - CONFIG.yRange[0]), 0, 1),
        nz: clamp((state.z - CONFIG.zRange[0]) / (CONFIG.zRange[1] - CONFIG.zRange[0]), 0, 1)
      };
    }
  };
}

