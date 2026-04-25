import type { PerformanceMetrics } from "../core/types";

/**
 * Client-side utility to fetch Lighthouse metrics from the local API.
 * @param url - The target URL to audit.
 * @returns A promise resolving to performance metrics.
 */
export async function fetchMetrics(url: string): Promise<PerformanceMetrics> {
  let validUrl: string;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    validUrl = parsed.toString();
  } catch (error) {
    throw new Error("INVALID_URL");
  }

  try {
    const response = await fetch(`/api/lighthouse?url=${encodeURIComponent(validUrl)}`);
    if (!response.ok) {
      throw new Error("INVALID_URL");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("INVALID_URL");
  }
}
