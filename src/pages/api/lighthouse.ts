// ============================================================
// Lighthouse API Endpoint
// ============================================================

import type { APIRoute } from "astro";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const chromeLauncher = require("chrome-launcher");
    const lighthouse = require("lighthouse");

    // Handle both ESM and CJS exports
    const lh =
      typeof lighthouse === "function" ? lighthouse : lighthouse.default;

    if (typeof lh !== "function") {
      throw new Error("Lighthouse module could not be resolved as a function");
    }

    const chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
    });

    const options = {
      port: chrome.port,
      output: "json",
      onlyCategories: ["performance"],
    };

    const result = await lh(targetUrl, options);

    await chrome.kill();

    if (!result || !result.lhr) {
      throw new Error("Lighthouse returned no results");
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

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Lighthouse error:", error.message);
    return new Response(
      JSON.stringify({ error: "Lighthouse failed", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
