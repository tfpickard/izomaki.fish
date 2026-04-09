import type { StateVector } from './types';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private drone: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private _isRunning = false;

  get isRunning(): boolean {
    return this._isRunning;
  }

  start(): void {
    if (this._isRunning) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.12;
    this.masterGain.connect(this.ctx.destination);

    // Drone oscillator
    this.drone = this.ctx.createOscillator();
    this.drone.type = 'sine';
    this.drone.frequency.value = 55;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.6;
    this.drone.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    this.drone.start();

    // Filtered noise layer
    const buffer = this.createNoiseBuffer();
    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.value = 200;
    this.noiseFilter.Q.value = 0.8;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0.2;

    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    this.noiseSource.start();

    this._isRunning = true;
  }

  stop(): void {
    if (!this._isRunning || !this.ctx) return;

    this.drone?.stop();
    this.noiseSource?.stop();
    this.ctx.close();

    this.drone = null;
    this.droneGain = null;
    this.noiseSource = null;
    this.noiseGain = null;
    this.noiseFilter = null;
    this.masterGain = null;
    this.ctx = null;
    this._isRunning = false;
  }

  update(state: StateVector, attractorZ: number): void {
    if (!this.ctx || !this.drone || !this.droneGain || !this.noiseFilter || !this.noiseGain) return;

    const t = this.ctx.currentTime;
    const ramp = 0.5;

    // Drone pitch follows attractor z (range 0-1) mapped to 40-80 Hz
    const baseFreq = 40 + attractorZ * 40;
    const agitationShift = state.agitation * 12;
    this.drone.frequency.linearRampToValueAtTime(baseFreq + agitationShift, t + ramp);

    // Noise filter frequency follows curiosity + wakefulness
    const filterFreq = 80 + state.curiosity * 400 + state.wakefulness * 200;
    this.noiseFilter.frequency.linearRampToValueAtTime(filterFreq, t + ramp);

    // Noise presence follows agitation
    const noiseLevel = 0.05 + state.agitation * 0.35;
    this.noiseGain.gain.linearRampToValueAtTime(noiseLevel, t + ramp);

    // Master volume follows wakefulness -- creature is quieter when dormant
    if (this.masterGain) {
      const vol = 0.04 + state.wakefulness * 0.12;
      this.masterGain.gain.linearRampToValueAtTime(vol, t + ramp);
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}
