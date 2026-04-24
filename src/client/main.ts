import { SimulationController } from "../core/simulation";
import {
  $systemSnapshot,
  $hoveredMetric,
  $selectedMetric,
} from "../store/systemStore";

const canvas = document.getElementById("simulation-canvas") as HTMLCanvasElement;
const urlInput = document.getElementById("url-input") as HTMLInputElement;
const btnRun = document.getElementById("btn-run") as HTMLButtonElement;
const progressFill = document.getElementById("console-progress-fill") as HTMLDivElement;
const nightToggle = document.getElementById("check-night") as HTMLInputElement;
const hud = document.getElementById("metrics-hud") as HTMLDivElement;
const scoreVal = document.getElementById("score-val") as HTMLSpanElement;
const slider = document.getElementById("score-slider") as HTMLInputElement;
const sliderVal = document.getElementById("slider-val") as HTMLSpanElement;
const btnToggleSim = document.getElementById("btn-toggle-sim") as HTMLButtonElement;
const floatingSim = document.getElementById("floating-simulator") as HTMLDivElement;

const controller = new SimulationController();
controller.init(canvas);

window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    setTimeout(() => preloader.remove(), 500);
  }
});

btnRun.addEventListener("click", async () => {
  const url = urlInput.value.trim();
  if (!url) return;

  try {
    btnRun.disabled = true;
    progressFill.style.width = "30%";
    await controller.runScan(url);
    progressFill.style.width = "100%";
    setTimeout(() => (progressFill.style.width = "0%"), 1000);
  } catch (err) {
    console.error(err);
    progressFill.style.width = "0%";
  } finally {
    btnRun.disabled = false;
  }
});

nightToggle.addEventListener("change", (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  controller.toggleNightMode(checked);
});

slider.addEventListener("input", (e) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  sliderVal.textContent = val.toString();
  controller.forceScore(val);
});

btnToggleSim.addEventListener("click", () => {
  floatingSim.classList.toggle("hidden");
});

document.querySelectorAll(".hud-row").forEach((row) => {
  const metric = row.querySelector(".hud-label span")?.textContent;
  if (!metric) return;

  row.addEventListener("mouseenter", () => $hoveredMetric.set(metric));
  row.addEventListener("mouseleave", () => $hoveredMetric.set(null));
  row.addEventListener("click", () => {
    const current = $selectedMetric.get();
    $selectedMetric.set(current === metric ? null : metric);
    
    document.querySelectorAll(".hud-row").forEach(r => r.classList.remove("active"));
    if ($selectedMetric.get()) row.classList.add("active");
  });
});

$systemSnapshot.subscribe((snapshot) => {
  if (snapshot) {
    hud.classList.remove("hidden");
    scoreVal.textContent = snapshot.metrics.performanceScore.toString();
    updateHudBar("lcp", snapshot.metrics.lcp, 4000);
    updateHudBar("fcp", snapshot.metrics.fcp, 2000);
    updateHudBar("tbt", snapshot.metrics.tbt, 600);
    updateHudBar("cls", snapshot.metrics.cls * 100, 25);
  } else {
    hud.classList.add("hidden");
  }
});

function updateHudBar(id: string, value: number, max: number) {
  const bar = document.getElementById(`bar-${id}`);
  const valText = document.getElementById(`val-${id}`);
  if (bar && valText) {
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    bar.style.width = `${percent}%`;
    valText.textContent = value.toFixed(id === "cls" ? 2 : 0);
  }
}
