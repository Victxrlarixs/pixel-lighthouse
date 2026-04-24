/**
 * Low-level Web Audio API wrapper for simulation sound effects and ambience.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambienceOsc: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;

  /**
   * Initializes the audio context if not already active.
   */
  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Starts a low-frequency hum to simulate data center ambience.
   */
  startAmbience() {
    this.init();
    if (!this.ctx) return;

    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = 0;
    this.ambienceGain.connect(this.ctx.destination);

    this.ambienceOsc = this.ctx.createOscillator();
    this.ambienceOsc.type = "sine";
    this.ambienceOsc.frequency.value = 60;
    this.ambienceOsc.connect(this.ambienceGain);
    this.ambienceOsc.start();
  }

  /**
   * Adjusts the volume of the ambience hum.
   * @param intensity - Gain value (0.0 to 1.0).
   */
  setAmbienceIntensity(intensity: number) {
    if (this.ambienceGain) {
      this.ambienceGain.gain.setTargetAtTime(
        intensity * 0.1,
        this.ctx!.currentTime,
        0.5,
      );
    }
  }

  /**
   * Plays a simple beep tone.
   * @param freq - Frequency in Hz.
   * @param duration - Duration in seconds.
   */
  playBeep(freq: number, duration: number) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  /**
   * Plays a rhythmic alarm sound for critical states.
   */
  playAlarm() {
    this.playBeep(880, 0.1);
    setTimeout(() => this.playBeep(440, 0.1), 150);
  }
}
