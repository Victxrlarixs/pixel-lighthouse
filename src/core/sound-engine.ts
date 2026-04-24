// ============================================================
// Sound Effects — Web Audio API procedural sounds
// ============================================================

import { SystemState } from "../core/types";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private currentState: SystemState = SystemState.STABLE;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  init() {
    this.ctx = new AudioContext();
    this.enabled = true;
  }

  toggle() {
    if (!this.ctx) this.init();
    this.enabled = !this.enabled;
    if (!this.enabled && this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc = null;
    }
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  updateState(state: SystemState) {
    if (!this.enabled || !this.ctx) return;
    if (state === this.currentState) return;

    const prev = this.currentState;
    this.currentState = state;

    // Transition sound
    if (state === SystemState.FIRE && prev !== SystemState.FIRE) {
      this.playAlarm();
    } else if (state === SystemState.CHAOS && prev === SystemState.STABLE) {
      this.playWarning();
    } else if (state === SystemState.STABLE && prev !== SystemState.STABLE) {
      this.playResolve();
    }

    this.updateAmbient();
  }

  private playAlarm() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain).connect(this.ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.setValueAtTime(440, this.ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  private playWarning() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain).connect(this.ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(660, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(330, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  private playResolve() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain).connect(this.ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(554, this.ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(660, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  private updateAmbient() {
    if (!this.ctx) return;
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc = null;
    }
    if (this.currentState === SystemState.STABLE) return;

    this.ambientOsc = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();
    this.ambientOsc.connect(this.ambientGain).connect(this.ctx.destination);
    this.ambientOsc.type = "sawtooth";
    this.ambientOsc.frequency.value =
      this.currentState === SystemState.FIRE ? 55 : 40;
    this.ambientGain.gain.value =
      this.currentState === SystemState.FIRE ? 0.015 : 0.008;
    this.ambientOsc.start();
  }

  destroy() {
    if (this.ambientOsc) this.ambientOsc.stop();
    if (this.ctx) this.ctx.close();
  }
}

export const soundEngine = new SoundEngine();
