import type { APIRoute } from "astro";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import path from "node:path";
import fs from "node:fs";

/**
 * Handles the Lighthouse performance audit request.
 * @param request - The incoming Astro request.
 * @returns A JSON response with performance metrics or an error.
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userDataDir = path.join(process.cwd(), ".lighthouse-profile");
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  console.log(`[Lighthouse API] Starting audit for: ${targetUrl}`);

  let chrome: any;
  try {
    console.log("[Lighthouse API] Launching Chrome...");
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
      userDataDir: userDataDir,
    });
    console.log(`[Lighthouse API] Chrome launched on port: ${chrome.port}`);

    const options = {
      port: chrome.port,
      output: "json" as const,
      onlyCategories: ["performance"],
    };

    console.log("[Lighthouse API] Running Lighthouse...");
    const result = await lighthouse(targetUrl, options);

    if (!result || !result.lhr) {
      throw new Error("Lighthouse returned no results (lhr is missing)");
    }

    const { lhr } = result;
    const perf = lhr.categories.performance;
    const audits = lhr.audits;

    const metrics = {
      performanceScore: Math.round((perf?.score ?? 0) * 100),
      fcp: audits["first-contentful-paint"]?.numericValue ?? 0,
      lcp: audits["largest-contentful-paint"]?.numericValue ?? 0,
      cls: audits["cumulative-layout-shift"]?.numericValue ?? 0,
      tbt: audits["total-blocking-time"]?.numericValue ?? 0,
      timestamp: Date.now(),
      url: targetUrl,
    };

    console.log(`[Lighthouse API] Audit complete. Score: ${metrics.performanceScore}`);

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Lighthouse API] Critical error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Lighthouse failed", 
        message: error.message,
        details: "Possible EPERM or Timeout. Check terminal logs."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  } finally {
    if (chrome && typeof chrome.kill === "function") {
      console.log("[Lighthouse API] Killing Chrome...");
      try {
        await chrome.kill();
      } catch (e) {
        console.error("Failed to kill Chrome instance:", e);
      }
    }
  }
};
