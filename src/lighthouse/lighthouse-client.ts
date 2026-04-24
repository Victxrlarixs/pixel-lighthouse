// ============================================================
// Lighthouse Service — Client-Side
// Fetches Lighthouse metrics from our API endpoint
// ============================================================

import type { LighthouseMetrics } from "../core/types";

/** Demo/fallback metrics for when Lighthouse isn't available */
function generateDemoMetrics(url: string): LighthouseMetrics {
  const base = 50 + Math.random() * 50;
  const variance = Math.sin(Date.now() / 100000) * 5;
  const score = Math.max(0, Math.min(100, Math.round(base + variance)));

  return {
    performanceScore: score,
    fcp: 800 + Math.random() * 4000,
    lcp: 1200 + Math.random() * 6000,
    cls: Math.random() * 0.4,
    tbt: Math.random() * 800,
    timestamp: Date.now(),
    url,
  };
}

/**
 * Fetch Lighthouse metrics from the server API.
 * Falls back to demo data if the server is unavailable.
 */
export async function fetchMetrics(url: string): Promise<LighthouseMetrics> {
  // 1. Basic URL Validation
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
  if (!url || !urlPattern.test(url)) {
    throw new Error("INVALID_URL");
  }

  try {
    const response = await fetch(
      `/api/lighthouse?url=${encodeURIComponent(url)}`,
    );
    if (!response.ok) {
      console.warn("Lighthouse API error, using demo data");
      return generateDemoMetrics(url);
    }
    const data = await response.json();
    return data as LighthouseMetrics;
  } catch (err) {
    console.warn("Lighthouse API unreachable, using demo data:", err);
    return generateDemoMetrics(url);
  }
}

/**
 * Generate demo metrics directly (for demo mode).
 */
export function getDemoMetrics(url: string): LighthouseMetrics {
  return generateDemoMetrics(url);
}

/**
 * Generate scenario-based demo metrics that cycle through states
 */
export function getScenarioMetrics(
  url: string,
  tick: number,
): LighthouseMetrics {
  const cycle = tick % 60;

  // Cycle: 0-20 STABLE, 20-40 CHAOS, 40-55 FIRE, 55-60 recovery
  let score: number;
  let fcp: number;
  let lcp: number;
  let cls: number;
  let tbt: number;

  if (cycle < 20) {
    // STABLE phase
    score = 90 + Math.random() * 10;
    fcp = 500 + Math.random() * 500;
    lcp = 800 + Math.random() * 700;
    cls = Math.random() * 0.05;
    tbt = Math.random() * 100;
  } else if (cycle < 40) {
    // CHAOS phase — degrading
    const chaos = (cycle - 20) / 20;
    score = 90 - chaos * 45;
    fcp = 500 + chaos * 3000 + Math.random() * 500;
    lcp = 800 + chaos * 5000 + Math.random() * 700;
    cls = chaos * 0.2 + Math.random() * 0.05;
    tbt = chaos * 500 + Math.random() * 100;
  } else if (cycle < 55) {
    // FIRE phase
    const fire = (cycle - 40) / 15;
    score = 45 - fire * 35;
    fcp = 3500 + Math.random() * 2000;
    lcp = 5500 + Math.random() * 3000;
    cls = 0.2 + fire * 0.3;
    tbt = 500 + fire * 500;
  } else {
    // Recovery
    const recovery = (cycle - 55) / 5;
    score = 10 + recovery * 80;
    fcp = 4000 - recovery * 3000;
    lcp = 6000 - recovery * 4500;
    cls = 0.3 - recovery * 0.25;
    tbt = 800 - recovery * 700;
  }

  return {
    performanceScore: Math.max(0, Math.min(100, Math.round(score))),
    fcp: Math.max(100, fcp),
    lcp: Math.max(200, lcp),
    cls: Math.max(0, cls),
    tbt: Math.max(0, tbt),
    timestamp: Date.now(),
    url,
  };
}
