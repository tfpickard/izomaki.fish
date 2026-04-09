import { clamp } from './types';
import type { AttractorState, Attractor, AttractorConfig } from './types';

const CONFIG: AttractorConfig = {
  name: 'sprott-b',
  params: { a: 0.4, b: 1.2, c: 1.0 },
  dt: 0.005,
  initialState: { x: 0.1, y: 0, z: 0 },
  xRange: [-2, 2],
  yRange: [-2, 2],
  zRange: [-1, 2]
};

export function createSprottB(): Attractor {
  return {
    config: { ...CONFIG },
    step(state: AttractorState, params?: Record<string, number>): AttractorState {
      const a = params?.a ?? CONFIG.params.a;
      const b = params?.b ?? CONFIG.params.b;
      const c = params?.c ?? CONFIG.params.c;
      const dt = CONFIG.dt;
      const dx = a * state.y * state.z * dt;
      const dy = (state.x - b * state.y) * dt;
      const dz = (c - state.x * state.y) * dt;
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

