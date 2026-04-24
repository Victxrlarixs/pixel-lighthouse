import { SimulationController } from "../core/simulation";
import {
  $performanceScore,
  $systemSnapshot,
  $isNightMode,
  $isScanning,
  $hoveredMetric,
  $selectedMetric,
} from "../store/systemStore";

export function initApp() {
  console.log("Initializing Pixel Insights UX Engine...");

  const canvas = document.getElementById(
    "simulation-canvas",
  ) as HTMLCanvasElement;
  const urlInput = document.getElementById("url-input") as HTMLInputElement;
  const btnRun = document.getElementById("btn-run");
  const metricsHud = document.getElementById("metrics-hud");
  const scoreVal = document.getElementById("score-val");
  const checkNight = document.getElementById("check-night") as HTMLInputElement;
  const progressFill = document.getElementById("console-progress-fill");

  const simToggle = document.getElementById("btn-toggle-sim");
  const simPanel = document.getElementById("floating-simulator");
  const scoreSlider = document.getElementById(
    "score-slider",
  ) as HTMLInputElement;
  const sliderVal = document.getElementById("slider-val");

  const rows = document.querySelectorAll(".hud-row");
  const barLcp = document.getElementById("bar-lcp");
  const barFcp = document.getElementById("bar-fcp");
  const barTbt = document.getElementById("bar-tbt");
  const barCls = document.getElementById("bar-cls");
  const valLcp = document.getElementById("val-lcp");
  const valFcp = document.getElementById("val-fcp");
  const valTbt = document.getElementById("val-tbt");
  const valCls = document.getElementById("val-cls");

  const sim = new SimulationController();
  if (canvas) sim.init(canvas);

  // --- Store Subscriptions ---

  $performanceScore.subscribe((score) => {
    if (scoreVal) {
      scoreVal.textContent = String(Math.round(score));
      scoreVal.style.color =
        score >= 90
          ? "var(--accent-cyan)"
          : score >= 60
            ? "var(--accent-green)"
            : score >= 30
              ? "var(--accent-yellow)"
              : "var(--accent-red)";
    }
    if (scoreSlider) scoreSlider.value = String(score);
    if (sliderVal) sliderVal.textContent = String(Math.round(score));
  });

  $systemSnapshot.subscribe((snap) => {
    if (!snap) return;
    metricsHud?.classList.remove("hidden");
    const s = snap.metrics.performanceScore;
    if (barLcp && valLcp) updateBar(barLcp, valLcp, s);
    if (barFcp && valFcp) updateBar(barFcp, valFcp, Math.min(100, s * 1.1));
    if (barTbt && valTbt) updateBar(barTbt, valTbt, Math.min(100, s * 0.9));
    if (barCls && valCls) updateBar(barCls, valCls, Math.min(100, s * 1.05));
  });

  $isScanning.subscribe((scanning) => {
    if (!btnRun) return;
    btnRun.innerHTML = scanning
      ? '<i class="fas fa-spinner fa-spin"></i>'
      : '<i class="fas fa-bolt"></i>';
  });

  function updateBar(bar: HTMLElement, val: HTMLElement, p: number) {
    const valP = Math.round(Math.min(100, Math.max(0, p)));
    bar.style.width = valP + "%";
    val.textContent = valP + "%";
    bar.style.background =
      valP >= 90
        ? "var(--accent-green)"
        : valP >= 50
          ? "var(--accent-yellow)"
          : "var(--accent-red)";
  }

  // --- Interaction Logic ---

  rows.forEach((row) => {
    const metricSpan = row.querySelector(".hud-label span");
    const metric = metricSpan?.textContent;
    if (!metric) return;

    row.addEventListener("mouseenter", () => $hoveredMetric.set(metric));
    row.addEventListener("mouseleave", () => $hoveredMetric.set(null));
    row.addEventListener("click", () => {
      const current = $selectedMetric.get();
      $selectedMetric.set(current === metric ? null : metric);
      rows.forEach((r) => r.classList.remove("active"));
      if ($selectedMetric.get() === metric) row.classList.add("active");
    });
  });

  // --- UI Events ---

  if (btnRun && urlInput) {
    btnRun.addEventListener("click", async () => {
      const url = urlInput.value.trim();
      if (!url) return;
      let progress = 0;
      const iv = setInterval(() => {
        progress += 1.5;
        if (progress > 95) progress = 95;
        if (progressFill) progressFill.style.width = progress + "%";
      }, 100);

      try {
        await sim.runScan(url);
        clearInterval(iv);
        if (progressFill) progressFill.style.width = "100%";
        setTimeout(() => {
          if (progressFill) progressFill.style.width = "0%";
        }, 2000);
      } catch (e) {
        clearInterval(iv);
        if (progressFill)
          progressFill.style.backgroundColor = "var(--accent-red)";
      }
    });

    urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") btnRun.click();
    });
  }

  if (checkNight) {
    checkNight.addEventListener("change", () =>
      sim.toggleNightMode(checkNight.checked),
    );
  }

  if (simToggle && simPanel) {
    console.log("Simulator Toggle detected and ready.");
    simToggle.addEventListener("click", () => {
      simPanel.classList.toggle("hidden");
      simToggle.style.color = simPanel.classList.contains("hidden")
        ? "var(--text-muted)"
        : "var(--accent-cyan)";
    });
  }

  if (scoreSlider) {
    scoreSlider.addEventListener("input", () =>
      sim.forceScore(parseInt(scoreSlider.value)),
    );
  }

  // Initial UI State
  if (urlInput) {
    urlInput.focus();
    const len = urlInput.value.length;
    urlInput.setSelectionRange(len, len);
  }

  // Preloader Logic
  const preloader = document.getElementById("preloader");
  if (preloader) {
    let p = 0;
    const start = Date.now();
    const ivPre = setInterval(() => {
      p++;
      if (p >= 100 && Date.now() - start >= 2000) {
        clearInterval(ivPre);
        preloader.style.opacity = "0";
        setTimeout(() => {
          preloader.style.display = "none";
        }, 500);
      }
    }, 20);
  }
}

// Ensure execution only when DOM is fully ready
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
}
