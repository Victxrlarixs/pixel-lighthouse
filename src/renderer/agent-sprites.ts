import { SystemState, type Agent } from "../core/types";
import { TILE_SIZE, ROLE_SHIRT_COLORS } from "./render-constants";

/**
 * Draws the special easter egg cat.
 * @param ctx - The canvas rendering context.
 * @param x - The X coordinate.
 * @param y - The Y coordinate.
 * @param tick - The animation tick.
 */
export function drawCat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const bounce = Math.abs(Math.sin(tick * 0.2)) * 3;
  ctx.save();
  ctx.translate(px + 24, py + 36 - bounce);
  ctx.fillStyle = "#2d2d2d";
  ctx.fillRect(-10, 0, 20, 10);
  ctx.fillRect(-12, -8, 8, 8);
  ctx.fillRect(-12, -10, 2, 2);
  ctx.fillRect(-6, -10, 2, 2);
  ctx.fillStyle = "#9ece6a";
  ctx.fillRect(-10, -6, 2, 2);
  ctx.fillRect(-6, -6, 2, 2);
  ctx.restore();
}

/**
 * Draws the body and animations of a human agent.
 * @param ctx - The canvas rendering context.
 * @param agent - The agent to draw.
 * @param state - The current system state.
 * @param _tick - The animation tick.
 */
export function drawAgentBody(
  ctx: CanvasRenderingContext2D,
  agent: Agent,
  _state: SystemState,
  _tick: number,
) {
  if (agent.id === "easter-cat") {
    drawCat(ctx, agent.x, agent.y, performance.now() * 0.06);
    return;
  }
  const t = performance.now() * 0.06;
  const px = agent.x * TILE_SIZE;
  const py = agent.y * TILE_SIZE;
  const isWalking =
    !agent.isSitting &&
    (agent.x !== agent.targetX || agent.y !== agent.targetY);

  const bounce = isWalking
    ? Math.abs(Math.sin(t * 0.2)) * 4
    : Math.sin(t * 0.1) * 2;
  const walkPhase = t * 0.15;
  const bodyWidth =
    agent.bodyType === "large" ? 32 : agent.bodyType === "slim" ? 18 : 24;
  const bodyX = px + (TILE_SIZE - bodyWidth) / 2;

  let ay = py - bounce;
  if (agent.isSitting) ay += 12;

  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.beginPath();
  const shadowR = agent.isSitting ? 8 : 12;
  ctx.ellipse(px + 24, py + 44, shadowR, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!agent.isSitting) {
    ctx.fillStyle = "#263238";
    const legOffset = isWalking ? Math.sin(walkPhase) * 6 : 0;
    ctx.fillRect(bodyX + 2, ay + 36, 8, 10 + legOffset);
    ctx.fillRect(bodyX + bodyWidth - 10, ay + 36, 8, 10 - legOffset);
  }

  ctx.fillStyle = ROLE_SHIRT_COLORS[agent.role] || "#fff";
  const shirtH = agent.isSitting ? 10 : 14;
  ctx.fillRect(bodyX, ay + 24, bodyWidth, shirtH);

  const armSwing = isWalking ? Math.sin(walkPhase) * 8 : Math.sin(t * 0.1) * 2;
  ctx.fillStyle = agent.skinColor;
  if (agent.isSitting) {
    ctx.fillRect(bodyX - 4, ay + 20 + armSwing, 6, 6);
    ctx.fillRect(bodyX + bodyWidth - 2, ay + 20 - armSwing, 6, 6);
  } else {
    ctx.fillRect(bodyX - 6, ay + 24 + armSwing, 8, 8);
    ctx.fillRect(bodyX + bodyWidth - 2, ay + 24 - armSwing, 8, 8);
  }

  ctx.fillStyle = agent.skinColor;
  ctx.fillRect(px + 14, ay + 6, 20, 18);

  const tbtScore = agent.metadata?.tbtScore || 100;
  if (tbtScore < 80 && !agent.isSitting) {
    const lagFactor = Math.floor((100 - tbtScore) / 10);
    if (Math.floor(t * 0.5) % (12 - lagFactor) === 0) {
      ctx.fillStyle = "rgba(247, 118, 142, 0.3)";
      ctx.fillRect(px + 10, ay + 2, 28, 40);
    }
  }

  ctx.fillStyle = agent.hairColor;
  if (agent.isWoman) {
    ctx.fillRect(px + 10, ay + 4, 28, 8);
    ctx.fillRect(px + 10, ay + 12, 4, 12);
    ctx.fillRect(px + 34, ay + 12, 4, 12);
  } else {
    ctx.fillRect(px + 12, ay + 4, 24, 8);
  }

  if (agent.direction !== "up") {
    ctx.fillStyle = "#263238";
    const ey = ay + 14;
    if (agent.direction === "down") {
      ctx.fillRect(px + 18, ey, 4, 4);
      ctx.fillRect(px + 26, ey, 4, 4);
    } else if (agent.direction === "left") {
      ctx.fillRect(px + 16, ey, 4, 4);
    } else {
      ctx.fillRect(px + 28, ey, 4, 4);
    }
  }

  ctx.save();
  const rx = px + 14;
  const ry = ay + 6;

  if (agent.role.includes("SRE") || agent.role.includes("Infrastructure")) {
    ctx.fillStyle = "#ffd600";
    ctx.fillRect(rx - 2, ry - 4, 24, 8);
    ctx.fillRect(rx - 4, ry + 2, 28, 2);
  }

  if (agent.role.includes("Lead")) {
    const tx = agent.direction === "right" ? bodyX + bodyWidth : bodyX - 10;
    ctx.fillStyle = "#1a1b26";
    ctx.fillRect(tx, ay + 20, 10, 14);
    ctx.fillStyle = "#7aa2f7";
    ctx.fillRect(tx + 2, ay + 22, 6, 10);
  }

  if (agent.role.includes("Database")) {
    const cx = agent.direction === "left" ? bodyX - 8 : bodyX + bodyWidth;
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(cx, ay + 22, 8, 8);
    ctx.fillStyle = "#795548";
    ctx.fillRect(cx + 2, ay + 22, 4, 2);
  }
  ctx.restore();
}

/**
 * Draws floating mood emoticons above agents.
 * @param ctx - The canvas rendering context.
 * @param agent - The agent to draw mood for.
 * @param tick - The animation tick.
 */
export function drawAgentMood(
  ctx: CanvasRenderingContext2D,
  agent: Agent,
  tick: number,
) {
  if (!agent.metadata?.mood) return;
  
  const px = agent.x * TILE_SIZE;
  const py = agent.y * TILE_SIZE;
  const bounce = Math.sin(tick * 0.1) * 4;
  const mx = px + 24;
  const my = py - 10 + bounce;

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(mx, my, 10, 0, Math.PI * 2);
  ctx.fill();
  
  const icons: Record<string, string> = {
    "chaos": "⚡",
    "fire": "💀",
    "happy": "💚",
    "working": "⏳",
    "coffee": "☕"
  };
  
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(icons[agent.metadata.mood] || "❓", mx, my);
}

/**
 * Draws a stylized dialogue bubble.
 * @param ctx - The canvas rendering context.
 * @param x - The center X coordinate.
 * @param y - The center Y coordinate.
 * @param text - The dialogue text.
 */
export function drawDialogueBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
) {
  ctx.font = "bold 12px sans-serif";
  const m = ctx.measureText(text);
  const w = m.width + 16;
  const h = 24;
  const bx = x - w / 2;
  const by = y - h - 16;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#263238";
  ctx.lineWidth = 2;
  ctx.fillRect(bx, by, w, h);
  ctx.strokeRect(bx, by, w, h);
  ctx.beginPath();
  ctx.moveTo(x - 6, by + h);
  ctx.lineTo(x, by + h + 8);
  ctx.lineTo(x + 6, by + h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#263238";
  ctx.textAlign = "center";
  ctx.fillText(text, x, by + h / 2 + 5);
  ctx.textAlign = "start";
}

/**
 * Renders dialogue for an agent if active.
 * @param ctx - The canvas rendering context.
 * @param agent - The agent speaking.
 * @param tick - The animation tick.
 */
export function drawAgentDialogue(
  ctx: CanvasRenderingContext2D,
  agent: Agent,
  tick: number,
) {
  if (!agent.dialogue) return;
  const px = agent.x * TILE_SIZE;
  const py = agent.y * TILE_SIZE;
  const bounce = !agent.isSitting ? Math.abs(Math.sin(tick * 0.2)) * 4 : 0;
  let ay = py - bounce;
  if (agent.isSitting) ay += 8;
  drawDialogueBubble(ctx, px + TILE_SIZE / 2, ay, agent.dialogue);
}

/**
 * Draws a static miniature of an agent for UI displays.
 * @param ctx - The canvas rendering context.
 * @param agent - The agent to draw.
 * @param x - The X position.
 * @param y - The Y position.
 * @param size - The target size.
 */
export function drawAgentMiniature(
  ctx: CanvasRenderingContext2D,
  agent: Agent,
  x: number,
  y: number,
  size: number,
) {
  const scale = size / 48;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = agent.skinColor;
  ctx.fillRect(14, 6, 20, 20);
  ctx.fillStyle = ROLE_SHIRT_COLORS[agent.role] || "#fff";
  ctx.fillRect(12, 26, 24, 18);
  ctx.fillStyle = agent.hairColor;
  if (agent.isWoman) {
    ctx.fillRect(10, 4, 28, 8);
  } else {
    ctx.fillRect(12, 4, 24, 10);
  }
  ctx.restore();
}

/**
 * Generates a Base64 image URL for an agent miniature.
 * @param agent - The agent to capture.
 * @returns The data URL string.
 */
export function getAgentMiniatureDataUrl(agent: Agent): string {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  drawAgentMiniature(ctx, agent, 0, 0, 32);
  return canvas.toDataURL();
}
