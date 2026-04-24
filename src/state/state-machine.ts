// ============================================================
// State Interpretation Engine
// Converts Lighthouse metrics into system states
// ============================================================

import {
  type LighthouseMetrics,
  type SystemSnapshot,
  type SystemEvent,
  type ThresholdConfig,
  type HistoryEntry,
  SystemState,
  DEFAULT_THRESHOLDS,
} from '../core/types';

let previousState: SystemState | null = null;
let consecutiveLowCount = 0;
let history: HistoryEntry[] = [];

/**
 * Compute instability factor (0–1) from CLS and TBT.
 */
function computeInstability(metrics: LighthouseMetrics, config: ThresholdConfig): number {
  const clsFactor = Math.min(metrics.cls / (config.clsWarning * 3), 1);
  const tbtFactor = Math.min(metrics.tbt / (config.tbtWarning * 3), 1);
  return Math.min((clsFactor + tbtFactor) / 2 + (clsFactor > 0.5 ? 0.2 : 0), 1);
}

/**
 * Determine base state from the performance score.
 */
function baseState(score: number, config: ThresholdConfig): SystemState {
  if (score >= config.stableMin) return SystemState.STABLE;
  if (score >= config.chaosMin) return SystemState.CHAOS;
  return SystemState.FIRE;
}

/**
 * Interpret raw Lighthouse metrics into a SystemSnapshot.
 */
export function interpret(
  metrics: LighthouseMetrics,
  config: ThresholdConfig = DEFAULT_THRESHOLDS,
): SystemSnapshot {
  let state = baseState(metrics.performanceScore, config);
  const instability = computeInstability(metrics, config);

  // High instability can escalate STABLE → CHAOS
  if (state === SystemState.STABLE && instability > 0.6) {
    state = SystemState.CHAOS;
  }

  // Sustained low scores escalate CHAOS → FIRE
  if (state === SystemState.CHAOS || state === SystemState.FIRE) {
    consecutiveLowCount++;
  } else {
    consecutiveLowCount = 0;
  }
  if (consecutiveLowCount >= 3 && state === SystemState.CHAOS) {
    state = SystemState.FIRE;
  }

  // Detect sudden drops
  const transitionTriggered = previousState !== null && previousState !== state;
  const events = generateEvents(metrics, state, config);

  const snapshot: SystemSnapshot = {
    state,
    metrics,
    previousState,
    transitionTriggered,
    instabilityFactor: instability,
    events,
  };

  previousState = state;
  history.push({ snapshot, timestamp: metrics.timestamp });

  // Keep last 100 entries
  if (history.length > 100) history = history.slice(-100);

  return snapshot;
}

/**
 * Generate context-aware events from metrics.
 */
function generateEvents(
  metrics: LighthouseMetrics,
  state: SystemState,
  config: ThresholdConfig,
): SystemEvent[] {
  const events: SystemEvent[] = [];
  const now = Date.now();

  if (metrics.lcp > 4000) {
    events.push({
      id: `evt-${now}-lcp`,
      message: `Latency spike detected — LCP ${(metrics.lcp / 1000).toFixed(1)}s`,
      severity: metrics.lcp > 6000 ? 'critical' : 'warning',
      timestamp: now,
      metric: 'LCP',
    });
  }

  if (metrics.cls > config.clsWarning) {
    events.push({
      id: `evt-${now}-cls`,
      message: `Layout shift instability — CLS ${metrics.cls.toFixed(3)}`,
      severity: metrics.cls > 0.25 ? 'critical' : 'warning',
      timestamp: now,
      metric: 'CLS',
    });
  }

  if (metrics.tbt > config.tbtWarning) {
    events.push({
      id: `evt-${now}-tbt`,
      message: `Thread blocking detected — TBT ${metrics.tbt.toFixed(0)}ms`,
      severity: metrics.tbt > 600 ? 'critical' : 'warning',
      timestamp: now,
      metric: 'TBT',
    });
  }

  if (metrics.fcp > 3000) {
    events.push({
      id: `evt-${now}-fcp`,
      message: `Slow first paint — FCP ${(metrics.fcp / 1000).toFixed(1)}s`,
      severity: 'warning',
      timestamp: now,
      metric: 'FCP',
    });
  }

  if (state === SystemState.FIRE) {
    events.push({
      id: `evt-${now}-fire`,
      message: 'Critical failure in node cluster — all hands on deck!',
      severity: 'critical',
      timestamp: now,
    });
  }

  if (state === SystemState.STABLE && metrics.performanceScore >= 95) {
    events.push({
      id: `evt-${now}-perf`,
      message: 'All systems nominal — performance excellent',
      severity: 'info',
      timestamp: now,
    });
  }

  return events;
}

/**
 * Get the full history of snapshots.
 */
export function getHistory(): HistoryEntry[] {
  return [...history];
}

/**
 * Reset engine state (for testing).
 */
export function resetState(): void {
  previousState = null;
  consecutiveLowCount = 0;
  history = [];
}
