// ============================================================
// Event Engine
// Maintains an event history log
// ============================================================

import type { SystemEvent, SystemSnapshot } from '../core/types';

const MAX_EVENTS = 50;
let eventLog: SystemEvent[] = [];

/**
 * Process a snapshot and collect its events into the log.
 */
export function processSnapshot(snapshot: SystemSnapshot): void {
  for (const event of snapshot.events) {
    eventLog.unshift(event);
  }
  // Trim
  if (eventLog.length > MAX_EVENTS) {
    eventLog = eventLog.slice(0, MAX_EVENTS);
  }
}

/**
 * Get the full event log (newest first).
 */
export function getEventLog(): SystemEvent[] {
  return [...eventLog];
}

/**
 * Clear the event log.
 */
export function clearEventLog(): void {
  eventLog = [];
}
