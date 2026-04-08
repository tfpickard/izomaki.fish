import { clamp } from './types';
import type { AttractorState, Attractor, AttractorConfig } from './types';

const CONFIG: AttractorConfig = {
  name: 'rossler',
  params: { a: 0.2, b: 0.2, c: 5.7 },
  dt: 0.01,
  initialState: { x: 1, y: 1, z: 0 },
  xRange: [-15, 15],
  yRange: [-15, 15],
  zRange: [0, 30]
};

export function createRossler(): Attractor {
  return {
    config: { ...CONFIG },
    step(state: AttractorState, params?: Record<string, number>): AttractorState {
      const a = params?.a ?? CONFIG.params.a;
      const b = params?.b ?? CONFIG.params.b;
      const c = params?.c ?? CONFIG.params.c;
      const dt = CONFIG.dt;
      const dx = (-(state.y + state.z)) * dt;
      const dy = (state.x + a * state.y) * dt;
      const dz = (b + state.z * (state.x - c)) * dt;
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

