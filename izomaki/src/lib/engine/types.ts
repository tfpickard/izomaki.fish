export interface StateVector {
  wakefulness: number;
  contentment: number;
  curiosity: number;
  agitation: number;
  hunger: number;
  presence: number;
}

export interface Frame {
  id: string;
  ascii: string;
  weights: StateVector;
  createdAt: number;
}

export interface TrajectoryConfig {
  frequency: number;
  amplitude: number;
  phase: number;
  noise: number;
}

export interface ParameterTrajectories {
  wakefulness: TrajectoryConfig;
  contentment: TrajectoryConfig;
  curiosity: TrajectoryConfig;
  agitation: TrajectoryConfig;
  hunger: TrajectoryConfig;
  presence: TrajectoryConfig;
}

export interface AttractorState {
  x: number;
  y: number;
  z: number;
}

export interface CelestialState {
  sun: number;
  moon: number;
}

export const PARAMETER_KEYS: (keyof StateVector)[] = [
  'wakefulness', 'contentment', 'curiosity',
  'agitation', 'hunger', 'presence'
];

export const DEFAULT_TRAJECTORIES: ParameterTrajectories = {
  wakefulness:  { frequency: 0.03, amplitude: 0.4,  phase: 0,          noise: 0.02 },
  contentment:  { frequency: 0.05, amplitude: 0.3,  phase: Math.PI/4,  noise: 0.03 },
  curiosity:    { frequency: 0.08, amplitude: 0.35, phase: Math.PI/2,  noise: 0.04 },
  agitation:    { frequency: 0.12, amplitude: 0.25, phase: Math.PI,    noise: 0.06 },
  hunger:       { frequency: 0.04, amplitude: 0.3,  phase: Math.PI/3,  noise: 0.03 },
  presence:     { frequency: 0.06, amplitude: 0.35, phase: Math.PI/6,  noise: 0.02 }
};
