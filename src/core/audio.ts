// ============================================================
// 8-bit Audio Engine — Pure Web Audio API
// Generates fans, beeps, and alarms without external files
// ============================================================

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private fanNode: BiquadFilterNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /** Start ambient server fan noise */
  startAmbience() {
    this.init();
    if (!this.ctx) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.fanNode = this.ctx.createBiquadFilter();
    this.fanNode.type = 'lowpass';
    this.fanNode.frequency.value = 400;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.05;

    this.noiseNode.connect(this.fanNode);
    this.fanNode.connect(gain);
    gain.connect(this.ctx.destination);
    this.noiseNode.start();
  }

  setAmbienceIntensity(val: number) {
    if (this.fanNode) {
      this.fanNode.frequency.value = 400 + (val * 1000);
    }
  }

  /** Play 8-bit beep */
  playBeep(freq = 440, duration = 0.1) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  /** Play emergency alarm */
  playAlarm() {
    this.init();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
    
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + 0.5);
  }
}

export const audio = new AudioEngine();
