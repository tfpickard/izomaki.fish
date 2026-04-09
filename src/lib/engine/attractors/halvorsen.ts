import { clamp } from './types';
import type { AttractorState, Attractor, AttractorConfig } from './types';

const CONFIG: AttractorConfig = {
  name: 'halvorsen',
  params: { a: 1.89 },
  dt: 0.002,
  initialState: { x: -1.48, y: -1.51, z: 2.04 },
  xRange: [-10, 10],
  yRange: [-10, 10],
  zRange: [-10, 10]
};

export function createHalvorsen(): Attractor {
  return {
    config: { ...CONFIG },
    step(state: AttractorState, params?: Record<string, number>): AttractorState {
      const a = params?.a ?? CONFIG.params.a;
      const dt = CONFIG.dt;
      const dx = (-a * state.x - 4 * state.y - 4 * state.z - state.y * state.y) * dt;
      const dy = (-a * state.y - 4 * state.z - 4 * state.x - state.z * state.z) * dt;
      const dz = (-a * state.z - 4 * state.x - 4 * state.y - state.x * state.x) * dt;
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

