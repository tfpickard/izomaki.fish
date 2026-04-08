import { clamp } from './types';
import type { AttractorState, Attractor, AttractorConfig } from './types';

const CONFIG: AttractorConfig = {
  name: 'chen-lee',
  params: { alpha: 5, beta: -10, delta: -0.38 },
  dt: 0.001,
  initialState: { x: 1, y: 1, z: 1 },
  xRange: [-25, 25],
  yRange: [-25, 25],
  zRange: [0, 50]
};

export function createChenLee(): Attractor {
  return {
    config: { ...CONFIG },
    step(state: AttractorState, params?: Record<string, number>): AttractorState {
      const alpha = params?.alpha ?? CONFIG.params.alpha;
      const beta = params?.beta ?? CONFIG.params.beta;
      const delta = params?.delta ?? CONFIG.params.delta;
      const dt = CONFIG.dt;
      const dx = (alpha * state.x - state.y * state.z) * dt;
      const dy = (beta * state.y + state.x * state.z) * dt;
      const dz = (delta * state.z + (state.x * state.y) / 3) * dt;
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

