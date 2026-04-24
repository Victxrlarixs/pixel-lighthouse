// ============================================================
// Simulation Controller — Easter Eggs & Demo Modes
// ============================================================

import { type SystemSnapshot, type Agent, type SystemEvent, SystemState, AgentRole, AgentState } from '../core/types';
import { interpret, getHistory } from '../state/state-machine';
import { processSnapshot, getEventLog } from '../core/event-engine';
import { createAgents, updateAgents, tickAgents } from '../agents/agent-manager';
import { fetchMetrics } from '../lighthouse/lighthouse-client';
import { CanvasRenderer } from '../renderer/canvas-renderer';
import { audio } from './audio';

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
  private isDoomMode = false;

  public onSnapshotUpdate?: (snapshot: SystemSnapshot) => void;
  public onEventsUpdate?: (events: SystemEvent[]) => void;
  public onAgentsUpdate?: (events: Agent[]) => void;
  public onScanStart?: () => void;
  public onScanEnd?: () => void;

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
    this.isDoomMode = false;
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
    
    this.onSnapshotUpdate?.(this.snapshot);
    if (this.tickCount % 20 === 0) audio.playBeep(440 + score * 5, 0.05);
  }

  triggerDoom() {
    this.isDoomMode = true;
    this.forceScore(0);
    audio.playAlarm();
  }

  spawnCat() {
    if (this.agents.find(a => a.id === 'easter-cat')) return;
    const cat: Agent = {
      id: 'easter-cat', role: AgentRole.SRE, state: AgentState.IDLE, currentTask: "Chasing bugs",
      x: 15, y: 12, targetX: 1, targetY: 12, homeX: 15, homeY: 12,
      animationFrame: 0, direction: 'left', speed: 2.0, dialogueTimer: 0, isSitting: false,
      skinColor: '#000', hairColor: '#000', bodyType: 'slim', isWoman: false,
      bio: "The office cat.", skills: ["Catching Mice", "Being Fluffy"]
    };
    this.agents.push(cat);
  }

  toggleNightMode(on: boolean) {
    this.renderer.setNightMode(on);
    audio.playBeep(on ? 220 : 440, 0.1);
  }

  private loop = (time: number) => {
    if (!this.running) return;
    
    let dt = (time - this.lastTime) / 1000;
    if (isNaN(dt) || dt <= 0 || dt > 0.1) dt = 0.016; 
    this.lastTime = time;
    this.tickCount++;

    if (this.tickCount % 2000 === 0 && Math.random() > 0.5) this.spawnCat();

    const currentScore = this.forcedScore !== null ? this.forcedScore : (this.snapshot ? this.snapshot.metrics.performanceScore : 0);
    const isFever = currentScore >= 90;
    this.renderer.setFeverMode(isFever);

    const scanElapsed = this.scanning ? (performance.now() - this.scanStartTime) / 1000 : 0;
    updateAgents(this.agents, this.snapshot, this.scanning, scanElapsed);
    tickAgents(this.agents, dt);

    const history = this.getHistoryScores();

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

    if (this.tickCount % 30 === 0) {
      this.onAgentsUpdate?.([...this.agents]);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private getHistoryScores(): number[] { return getHistory().map(h => h.snapshot.metrics.performanceScore); }

  async runScan(url: string): Promise<SystemSnapshot> {
    const lowUrl = url.toLowerCase();
    if (lowUrl === 'doom') { this.triggerDoom(); return this.snapshot!; }
    if (lowUrl === 'cat') { this.spawnCat(); this.forceScore(100); return this.snapshot!; }

    if (this.scanning) throw new Error('Scan already in progress');
    this.forcedScore = null; this.isDoomMode = false;
    if (!this.audioStarted) { audio.startAmbience(); this.audioStarted = true; }
    this.scanning = true; this.scanStartTime = performance.now();
    this.onScanStart?.();
    
    try {
      const metrics = await fetchMetrics(url);
      this.snapshot = interpret(metrics);
      processSnapshot(this.snapshot);
      this.scanning = false;
      this.onSnapshotUpdate?.(this.snapshot);
      this.onEventsUpdate?.(getEventLog());
      return this.snapshot;
    } catch (error) {
      this.scanning = false;
      // Triger Chaos/Fire if URL is down
      this.forceScore(Math.random() * 20 + 10);
      this.agents.forEach(a => {
        if (Math.random() > 0.5) {
          a.dialogue = "WEBSITE IS DOWN!";
          a.dialogueTimer = 5;
        }
      });
      throw error;
    } finally {
      this.onScanEnd?.();
    }
  }

  isScanning() { return this.scanning; }
  getSnapshot() { return this.snapshot; }
  getAgents() { return [...this.agents]; }
  destroy() { this.running = false; if (this.animFrameId) cancelAnimationFrame(this.animFrameId); }
}
