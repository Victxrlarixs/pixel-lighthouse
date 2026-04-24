import type { PerformanceMetrics } from "../core/types";

/**
 * Client-side utility to fetch Lighthouse metrics from the local API.
 * @param url - The target URL to audit.
 * @returns A promise resolving to performance metrics.
 */
export async function fetchMetrics(url: string): Promise<PerformanceMetrics> {
  try {
    const response = await fetch(`/api/lighthouse?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Lighthouse API error, using demo data", error);
    return getDemoData(url);
  }
}

function getDemoData(url: string): PerformanceMetrics {
  const score = Math.floor(Math.random() * 40) + 60;
  return {
    performanceScore: score,
    fcp: 800 + Math.random() * 1000,
    lcp: 1200 + Math.random() * 2000,
    cls: Math.random() * 0.2,
    tbt: Math.random() * 300,
    timestamp: Date.now(),
    url
  };
}
