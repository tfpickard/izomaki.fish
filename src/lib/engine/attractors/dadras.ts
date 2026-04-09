import { clamp } from './types';
import type { AttractorState, Attractor, AttractorConfig } from './types';

const CONFIG: AttractorConfig = {
  name: 'dadras',
  params: { a: 3.0, b: 2.7, c: 1.7, d: 2.0, e: 9.0 },
  dt: 0.002,
  initialState: { x: 1, y: 1, z: 1 },
  xRange: [-15, 15],
  yRange: [-15, 15],
  zRange: [0, 30]
};

export function createDadras(): Attractor {
  return {
    config: { ...CONFIG },
    step(state: AttractorState, params?: Record<string, number>): AttractorState {
      const a = params?.a ?? CONFIG.params.a;
      const b = params?.b ?? CONFIG.params.b;
      const c = params?.c ?? CONFIG.params.c;
      const d = params?.d ?? CONFIG.params.d;
      const e = params?.e ?? CONFIG.params.e;
      const dt = CONFIG.dt;
      const dx = (state.y - a * state.x + b * state.y * state.z) * dt;
      const dy = (c * state.y - state.x * state.z + state.z) * dt;
      const dz = (d * state.x * state.y - e * state.z) * dt;
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

