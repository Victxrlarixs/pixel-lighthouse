import {
  type SystemSnapshot,
  type SystemEvent,
} from "../core/types";

let eventLog: SystemEvent[] = [];

/**
 * Processes a system snapshot to generate relevant events.
 * @param snapshot - The snapshot to analyze.
 */
export function processSnapshot(snapshot: SystemSnapshot): void {
  const { metrics, state } = snapshot;

  if (state !== "STABLE") {
    const event: SystemEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: state,
      severity: state === "FIRE" ? "critical" : "warning",
      message: state === "FIRE" ? "CRITICAL PERFORMANCE DEGRADATION" : "PERFORMANCE REGRESSION DETECTED",
      category: "Lighthouse",
    };
    eventLog.push(event);
    snapshot.activeEvents.push(event);
  }
}

/**
 * Retrieves the global log of system events.
 * @returns Array of system events.
 */
export function getEventLog(): SystemEvent[] {
  return eventLog;
}
