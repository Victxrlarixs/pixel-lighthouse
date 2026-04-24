import { SimulationController } from '../core/simulation';

export function initApp() {
  // --- Preloader Logic ---
  const preloader = document.getElementById('preloader');
  if (preloader) {
    let p = 0;
    const start = Date.now();
    const ivPre = setInterval(() => {
      p++;
      if (p >= 100 && (Date.now() - start) >= 2000) {
        clearInterval(ivPre);
        preloader.style.opacity = '0';
        setTimeout(() => { preloader.style.display = 'none'; }, 500);
      }
    }, 20);
  }

  // --- Simulation Logic ---
  const canvas = document.getElementById('simulation-canvas') as HTMLCanvasElement;
  const urlInput = document.getElementById('url-input') as HTMLInputElement;
  const btnRun = document.getElementById('btn-scan')!;
  const metricsHud = document.getElementById('metrics-hud')!;
  const scoreVal = document.getElementById('score-val')!;
  const nightToggle = document.getElementById('night-toggle') as HTMLInputElement;
  const progressFill = document.getElementById('progress-fill')!;
  
  const simToggle = document.getElementById('btn-toggle-sim')!;
  const simPanel = document.getElementById('floating-simulator')!;
  const simSlider = document.getElementById('sim-score') as HTMLInputElement;
  const simVal = document.getElementById('sim-val')!;

  const barLcp = document.getElementById('bar-lcp')!;
  const barFcp = document.getElementById('bar-fcp')!;
  const barTbt = document.getElementById('bar-tbt')!;
  const barCls = document.getElementById('bar-cls')!;
  const valLcp = document.getElementById('val-lcp')!;
  const valFcp = document.getElementById('val-fcp')!;
  const valTbt = document.getElementById('val-tbt')!;
  const valCls = document.getElementById('val-cls')!;

  const sim = new SimulationController();

  if (urlInput) {
    urlInput.focus();
    urlInput.selectionStart = urlInput.selectionEnd = urlInput.value.length;
  }

  sim.onSnapshotUpdate = (snap) => {
    if (!scoreVal) return;
    const score = Math.round(snap.metrics.performanceScore);
    scoreVal.textContent = String(score);
    const color = score >= 90 ? '#2ac3de' : (score >= 60 ? '#9ece6a' : (score >= 30 ? '#e0af68' : '#f7768e'));
    scoreVal.style.color = color;
    
    if (snap.metrics.lcp !== undefined) {
      updateBar(barLcp, valLcp, score);
      updateBar(barFcp, valFcp, Math.min(100, score * 1.1));
      updateBar(barTbt, valTbt, Math.min(100, score * 0.9));
      updateBar(barCls, valCls, Math.min(100, score * 1.05));
    }
  };

  function updateBar(bar: HTMLElement, val: HTMLElement, p: number) {
    if (!bar || !val) return;
    const valP = Math.round(Math.min(100, Math.max(0, p)));
    bar.style.width = valP + '%';
    val.textContent = valP + '%';
  }

  if (canvas) sim.init(canvas);

  if (btnRun) {
    btnRun.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!url) return;
      
      const originalContent = btnRun.innerHTML;
      btnRun.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      
      let progress = 0;
      const iv = setInterval(() => {
        progress += 1.5;
        if (progress > 95) progress = 95;
        if (progressFill) progressFill.style.width = progress + '%';
      }, 100);

      try {
        await sim.runScan(url);
        clearInterval(iv);
        if (progressFill) progressFill.style.width = '100%';
        if (simSlider) {
          simSlider.value = String(sim.getSnapshot()!.metrics.performanceScore);
          simVal.textContent = simSlider.value;
        }
        if (metricsHud) metricsHud.classList.remove('hidden');
        setTimeout(() => { if (progressFill) progressFill.style.width = '0%'; }, 2000);
      } catch (e) {
        clearInterval(iv);
        if (progressFill) progressFill.style.backgroundColor = '#f7768e';
      } finally {
        btnRun.innerHTML = originalContent;
      }
    });
  }

  if (urlInput) urlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnRun.click(); });
  if (nightToggle) nightToggle.addEventListener('change', () => { sim.toggleNightMode(nightToggle.checked); });
  
  if (simToggle) {
    simToggle.addEventListener('click', () => {
      simPanel.classList.toggle('hidden');
      simToggle.style.color = simPanel.classList.contains('hidden') ? 'var(--text-muted)' : 'var(--accent-cyan)';
    });
  }

  if (simSlider) {
    simSlider.addEventListener('input', () => {
      const val = parseInt(simSlider.value);
      simVal.textContent = String(val);
      sim.forceScore(val);
    });
  }
}

// Initialize on DOM load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initApp);
}
