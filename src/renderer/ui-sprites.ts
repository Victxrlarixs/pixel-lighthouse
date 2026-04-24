import { TILE_SIZE, HIGHLIGHT_COLORS } from "./render-constants";

/**
 * Draws the historical performance trend graph.
 * @param ctx - The canvas rendering context.
 * @param x - The X position.
 * @param y - The Y position.
 * @param history - Array of historical performance scores.
 */
export function drawTrendGraph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  history: number[],
) {
  const w = 140;
  const h = 60;
  ctx.fillStyle = "rgba(38, 50, 56, 0.95)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#90a4ae";
  ctx.strokeRect(x, y, w, h);
  if (history.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = "#03a9f4";
  ctx.lineWidth = 2;
  const step = w / (history.length - 1);
  for (let i = 0; i < history.length; i++) {
    const px = x + i * step;
    const py = y + h - (history[i] / 100) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = '8px "Press Start 2P"';
  ctx.fillText("METRICS", x + 5, y - 5);
}

/**
 * Draws smoke particles for damaged servers.
 * @param ctx - The canvas rendering context.
 * @param x - The X center.
 * @param y - The Y center.
 * @param tick - The animation tick.
 */
export function drawSmoke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
) {
  ctx.fillStyle = "rgba(120,144,156,0.6)";
  const oy = -((tick * 0.4) % 60);
  ctx.beginPath();
  ctx.arc(x, y + oy, 14 + Math.sin(tick * 0.1) * 4, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws animated fire effects.
 * @param ctx - The canvas rendering context.
 * @param x - The X center.
 * @param y - The Y center.
 * @param tick - The animation tick.
 */
export function drawFire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
) {
  const phase = tick * 0.3;
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 3; i++) {
    const size = 10 + Math.sin(phase + i) * 8;
    const offX = Math.sin(phase * 0.8 + i) * 10;
    const offY = -i * 12;
    ctx.fillStyle = i === 0 ? "#ff5722" : i === 1 ? "#ff9800" : "#ffeb3b";
    ctx.beginPath();
    ctx.moveTo(offX, offY);
    ctx.lineTo(offX - size, offY + size * 1.5);
    ctx.lineTo(offX + size, offY + size * 1.5);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Highlights a specific grid tile related to a performance metric.
 * @param ctx - The canvas rendering context.
 * @param metric - The metric key (LCP, FCP, etc).
 * @param x - Grid X.
 * @param y - Grid Y.
 * @param tick - Animation tick.
 */
export function drawMetricHighlight(
  ctx: CanvasRenderingContext2D,
  metric: string,
  x: number,
  y: number,
  tick: number,
) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const color = HIGHLIGHT_COLORS[metric] || "#fff";
  const alpha = 0.3 + Math.abs(Math.sin(tick * 0.1)) * 0.4;

  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.lineDashOffset = -tick;
  ctx.strokeRect(px - 4, py - 4, TILE_SIZE + 8, TILE_SIZE + 8);
  ctx.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${alpha * 0.2})`;
  ctx.fillRect(px - 4, py - 4, TILE_SIZE + 8, TILE_SIZE + 8);
  ctx.restore();
}

/**
 * Visualizes the Largest Contentful Paint (LCP) as a heavy weight.
 * @param ctx - The canvas rendering context.
 * @param x - Grid X.
 * @param y - Grid Y.
 * @param score - The performance score.
 * @param tick - Animation tick.
 */
export function drawLCPWeight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  score: number,
  tick: number,
) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const severity = (100 - score) / 100;
  const shake = Math.sin(tick * 0.5) * (severity * 5);

  ctx.fillStyle = "#24283b";
  ctx.fillRect(px + shake, py - 10, TILE_SIZE * 1.5, TILE_SIZE + 10);
  ctx.strokeStyle = "#7aa2f7";
  ctx.lineWidth = 2;
  ctx.strokeRect(px + shake, py - 10, TILE_SIZE * 1.5, TILE_SIZE + 10);

  ctx.fillStyle = "#e0af68";
  ctx.fillRect(px + shake + 10, py - 10, 5, TILE_SIZE + 10);
  ctx.fillRect(px + shake + TILE_SIZE, py - 10, 5, TILE_SIZE + 10);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("LCP", px + shake + 15, py + 15);
}

/**
 * Applies a visual jitter effect to the entire context based on CLS score.
 * @param ctx - The canvas rendering context.
 * @param score - The CLS stability score.
 * @param tick - Animation tick.
 */
export function applyCLSJitter(
  ctx: CanvasRenderingContext2D,
  score: number,
  tick: number,
) {
  const severity = (100 - score) / 100;
  if (severity < 0.1) return;

  const jitterX = Math.sin(tick * 0.2) * (severity * 20);
  const jitterY = Math.cos(tick * 0.25) * (severity * 10);
  ctx.translate(jitterX, jitterY);
}
