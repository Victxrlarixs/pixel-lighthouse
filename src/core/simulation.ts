import {
  type SystemSnapshot,
  type Agent,
  SystemState,
  AgentRole,
  AgentState,
} from "../core/types";
import { interpret, getHistory } from "../state/state-machine";
import { processSnapshot, getEventLog } from "../core/event-engine";
import {
  createAgents,
  updateAgents,
  tickAgents,
} from "../agents/agent-manager";
import { fetchMetrics } from "../lighthouse/lighthouse-client";
import { CanvasRenderer } from "../renderer/canvas-renderer";
import { audio } from "./audio";
import {
  $performanceScore,
  $systemSnapshot,
  $agents,
  $isNightMode,
  $isScanning,
  $history,
} from "../store/systemStore";

/**
 * Controller for the entire simulation lifecycle.
 */
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

  /**
   * Initializes the simulation with a target canvas.
   * @param canvas - The target HTML canvas.
   */
  init(canvas: HTMLCanvasElement) {
    this.renderer = new CanvasRenderer(canvas);
    this.running = true;
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  /**
   * Forces a specific performance score for simulation purposes.
   * @param score - Performance score (0-100).
   */
  forceScore(score: number) {
    if (!this.audioStarted) {
      audio.startAmbience();
      this.audioStarted = true;
    }
    this.forcedScore = score;

    this.snapshot = interpret({
      performanceScore: score,
      fcp: 200 + (100 - score) * 50,
      lcp: 400 + (100 - score) * 100,
      cls: (100 - score) / 400,
      tbt: (100 - score) * 10,
      timestamp: Date.now(),
      url: "scenario-simulator",
    });

    $performanceScore.set(score);
    $systemSnapshot.set(this.snapshot);
    if (this.tickCount % 20 === 0) audio.playBeep(440 + score * 5, 0.05);
  }

  /**
   * Toggles night mode effect.
   * @param on - Boolean to enable/disable.
   */
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

    const currentScore =
      this.forcedScore !== null
        ? this.forcedScore
        : this.snapshot
          ? this.snapshot.metrics.performanceScore
          : 0;
    const isFever = currentScore >= 90;
    this.renderer.setFeverMode(isFever);

    const scanElapsed = this.scanning
      ? (performance.now() - this.scanStartTime) / 1000
      : 0;
    const isChaos = this.snapshot?.state === SystemState.CHAOS || this.snapshot?.state === SystemState.FIRE;
    updateAgents(this.agents, this.snapshot, this.scanning, scanElapsed);
    tickAgents(this.agents, dt, isChaos);

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
        if (this.tickCount % 60 === 0)
          audio.playBeep(880 + Math.random() * 400, 0.05);
      } else {
        audio.setAmbienceIntensity(0);
      }
    }

    if (this.snapshot) {
      this.renderer.render(this.snapshot, this.agents, history);
    } else {
      this.renderer.renderIdle(
        this.agents,
        this.tickCount,
        this.scanning,
        history,
      );
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private getHistoryScores(): number[] {
    return getHistory().map((h) => h.snapshot.metrics.performanceScore);
  }

  /**
   * Triggers a live Lighthouse audit scan.
   * @param url - The target URL to audit.
   * @returns A promise resolving to the final system snapshot.
   */
  async runScan(url: string): Promise<SystemSnapshot> {
    if (this.scanning) throw new Error("Scan already in progress");
    
    this.snapshot = null;
    this.forcedScore = null;
    $systemSnapshot.set(null);
    $performanceScore.set(0); 
    if (!this.audioStarted) {
      audio.startAmbience();
      this.audioStarted = true;
    }
    this.scanning = true;
    $isScanning.set(true);
    this.scanStartTime = performance.now();
    
    this.agents.forEach(a => {
      a.dialogue = undefined;
      a.dialogueTimer = 0;
    });

    try {
      const metrics = await fetchMetrics(url);
      this.snapshot = interpret(metrics);
      processSnapshot(this.snapshot);
      this.scanning = false;
      $isScanning.set(false);
      $systemSnapshot.set(this.snapshot);
      $performanceScore.set(this.snapshot.metrics.performanceScore);
      return this.snapshot;
    } catch (error: any) {
      this.scanning = false;
      $isScanning.set(false);
      
      if (error.message === "INVALID_URL") {
        this.forceScore(0);
        this.agents.forEach(a => {
          a.dialogue = "INVALID URL TARGET!";
          a.dialogueTimer = 4;
        });
      } else {
        this.forceScore(Math.random() * 20 + 10);
      }
      throw error;
    }
  }

  /**
   * Returns the current system snapshot.
   */
  getSnapshot() {
    return this.snapshot;
  }

  /**
   * Cleans up resources and stops the simulation.
   */
  destroy() {
    this.running = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}
