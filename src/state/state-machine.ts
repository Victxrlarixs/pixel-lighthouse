import {
  type PerformanceMetrics,
  type SystemSnapshot,
  SystemState,
} from "../core/types";

let history: { snapshot: SystemSnapshot }[] = [];

/**
 * Interprets raw performance metrics into a higher-level system state.
 * @param metrics - The raw metrics from Lighthouse.
 * @returns A snapshot containing the interpreted state.
 */
export function interpret(metrics: PerformanceMetrics): SystemSnapshot {
  let state = SystemState.STABLE;
  const score = metrics.performanceScore;

  if (score < 50) state = SystemState.FIRE;
  else if (score < 90) state = SystemState.CHAOS;

  const snapshot: SystemSnapshot = {
    metrics,
    state,
    activeEvents: [],
  };

  history.push({ snapshot });
  if (history.length > 50) history.shift();

  return snapshot;
}

/**
 * Retrieves the recent history of system snapshots.
 * @returns Array of historical records.
 */
export function getHistory() {
  return history;
}
