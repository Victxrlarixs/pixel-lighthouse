// ============================================================
// Simulation Controller — Easter Eggs & Demo Modes
// ============================================================

import { type SystemSnapshot, type Agent, SystemState, AgentRole, AgentState } from '../core/types';
import { interpret, getHistory } from '../state/state-machine';
import { processSnapshot, getEventLog } from '../core/event-engine';
import { createAgents, updateAgents, tickAgents } from '../agents/agent-manager';
import { fetchMetrics } from '../lighthouse/lighthouse-client';
import { CanvasRenderer } from '../renderer/canvas-renderer';
import { audio } from './audio';
import { 
  $performanceScore, 
  $systemSnapshot, 
  $agents, 
  $isNightMode, 
  $isScanning, 
  $history 
} from '../store/systemStore';

export class SimulationController {
  private renderer!: CanvasRenderer;
  private agents: Agent[];
  private snapshot: SystemSnapshot | null = null;
  private tickCount = 0;
  private animFrameId = 0;
  private lastTime = 0;
  private running = false;
  private scanning = false;
  private scanStartTime = 0;
  private audioStarted = false;
  private forcedScore: number | null = null;

  public onSnapshotUpdate?: (snapshot: SystemSnapshot) => void;
  public onEventsUpdate?: (events: any[]) => void;

  constructor() {
    this.agents = createAgents();
  }

  init(canvas: HTMLCanvasElement) {
    this.renderer = new CanvasRenderer(canvas);
    this.running = true;
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  forceScore(score: number) {
    if (!this.audioStarted) { audio.startAmbience(); this.audioStarted = true; }
    this.forcedScore = score;
    
    this.snapshot = interpret({
      performanceScore: score,
      fcp: 200 + (100 - score) * 50,
      lcp: 400 + (100 - score) * 100,
      cls: (100 - score) / 400,
      tbt: (100 - score) * 10,
      timestamp: Date.now(),
      url: 'scenario-simulator'
    });
    
    $performanceScore.set(score);
    $systemSnapshot.set(this.snapshot);
    if (this.tickCount % 20 === 0) audio.playBeep(440 + score * 5, 0.05);
  }

  toggleNightMode(on: boolean) {
    this.renderer.setNightMode(on);
    $isNightMode.set(on);
    audio.playBeep(on ? 220 : 440, 0.1);
  }

  private loop = (time: number) => {
    if (!this.running) return;
    
    let dt = (time - this.lastTime) / 1000;
    if (isNaN(dt) || dt <= 0 || dt > 0.1) dt = 0.016; 
    this.lastTime = time;
    this.tickCount++;

    const currentScore = this.forcedScore !== null ? this.forcedScore : (this.snapshot ? this.snapshot.metrics.performanceScore : 0);
    const isFever = currentScore >= 90;
    this.renderer.setFeverMode(isFever);

    const scanElapsed = this.scanning ? (performance.now() - this.scanStartTime) / 1000 : 0;
    updateAgents(this.agents, this.snapshot, this.scanning, scanElapsed);
    tickAgents(this.agents, dt);

    const history = this.getHistoryScores();
    $history.set(history);
    $agents.set([...this.agents]);

    if (this.audioStarted) {
      if (this.scanning) audio.setAmbienceIntensity(0.5);
      else if (this.snapshot?.state === SystemState.FIRE) {
        audio.setAmbienceIntensity(1.0);
        if (this.tickCount % 120 === 0) audio.playAlarm();
      } else if (isFever) {
        audio.setAmbienceIntensity(0.2);
        if (this.tickCount % 60 === 0) audio.playBeep(880 + Math.random() * 400, 0.05);
      } else {
        audio.setAmbienceIntensity(0);
      }
    }

    if (this.snapshot) {
      this.renderer.render(this.snapshot, this.agents, history);
    } else {
      this.renderer.renderIdle(this.agents, this.tickCount, this.scanning, history);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private getHistoryScores(): number[] { return getHistory().map(h => h.snapshot.metrics.performanceScore); }

  async runScan(url: string): Promise<SystemSnapshot> {
    if (this.scanning) throw new Error('Scan already in progress');
    this.forcedScore = null;
    if (!this.audioStarted) { audio.startAmbience(); this.audioStarted = true; }
    this.scanning = true; 
    $isScanning.set(true);
    this.scanStartTime = performance.now();
    
    try {
      const metrics = await fetchMetrics(url);
      this.snapshot = interpret(metrics);
      processSnapshot(this.snapshot);
      this.scanning = false;
      $isScanning.set(false);
      $systemSnapshot.set(this.snapshot);
      $performanceScore.set(this.snapshot.metrics.performanceScore);
      return this.snapshot;
    } catch (error) {
      this.scanning = false;
      $isScanning.set(false);
      this.forceScore(Math.random() * 20 + 10);
      throw error;
    }
  }

  getSnapshot() { return this.snapshot; }
  destroy() { this.running = false; if (this.animFrameId) cancelAnimationFrame(this.animFrameId); }
}
