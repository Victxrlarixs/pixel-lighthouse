// ============================================================
// GBA Pokémon-style Pixel Art Sprites — ULTRA POLISH
// ============================================================

import { TileType, SystemState, AgentRole, type Agent } from '../core/types';

const TILE_SIZE = 48;

const STATE_COLORS = {
  [SystemState.STABLE]: { accent: '#7aa2f7', bg: '#1a1b26', floor1: '#cfd8dc', floor2: '#eceff1', wallMain: '#90a4ae', wallDark: '#455a64', wallLight: '#cfd8dc' },
  [SystemState.CHAOS]: { accent: '#e0af68', bg: '#1a1b26', floor1: '#cfd8dc', floor2: '#eceff1', wallMain: '#90a4ae', wallDark: '#455a64', wallLight: '#cfd8dc' },
  [SystemState.FIRE]: { accent: '#f7768e', bg: '#1a1b26', floor1: '#cfd8dc', floor2: '#eceff1', wallMain: '#90a4ae', wallDark: '#455a64', wallLight: '#cfd8dc' },
};

// UI Interaction Tokens
const HIGHLIGHT_COLORS: Record<string, string> = {
  LCP: '#f7768e',
  FCP: '#7aa2f7',
  TBT: '#e0af68',
  CLS: '#9ece6a'
};

const ROLE_SHIRT_COLORS: Record<string, string> = {
  [AgentRole.PERFORMANCE_LEAD]: '#7aa2f7', [AgentRole.SRE]: '#bb9af7', [AgentRole.INFRA_ENGINEER]: '#9ece6a', [AgentRole.NETWORK_SPECIALIST]: '#f7768e', [AgentRole.SYSTEM_ANALYST]: '#7dcfff', [AgentRole.DBA]: '#e0af68', [AgentRole.FIREFIGHTER]: '#ff9e64'
};

export function getStateColors(state: SystemState) { return STATE_COLORS[state]; }
export { TILE_SIZE };

export function drawFloor(ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number, state: SystemState) {
  const px = x * TILE_SIZE; const py = y * TILE_SIZE;
  const c = STATE_COLORS[state];
  ctx.fillStyle = (x + y) % 2 === 0 ? c.floor1 : c.floor2; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  if (tile === TileType.CARPET) { ctx.fillStyle = '#b0bec5'; ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4); }
  else if (tile === TileType.CABLE_H) {
    ctx.fillStyle = '#263238'; ctx.fillRect(px, py + 16, TILE_SIZE, 16);
    ctx.fillStyle = '#03a9f4'; ctx.fillRect(px, py + 20, TILE_SIZE, 4);
  }
}

export function drawTileBase(ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number, state: SystemState, agents: Agent[], tick: number, isNight = false) {
  const px = x * TILE_SIZE; const py = y * TILE_SIZE;
  switch (tile) {
    case TileType.SERVER: case TileType.RACK: case TileType.SERVER_LARGE:
      ctx.fillStyle = '#1a1b26'; ctx.fillRect(px + 4, py + 12, TILE_SIZE - 8, TILE_SIZE - 12);
      break;
    case TileType.DESK: case TileType.MONITOR: case TileType.LAPTOP:
      ctx.fillStyle = '#5d4037'; ctx.fillRect(px + 2, py + 16, TILE_SIZE - 4, 16);
      ctx.fillStyle = '#3e2723'; ctx.fillRect(px + 4, py + 30, 6, 12); ctx.fillRect(px + TILE_SIZE - 10, py + 30, 6, 12);
      break;
    case TileType.SLIDING_DOOR:
      ctx.fillStyle = '#37474f'; ctx.fillRect(px, py + 8, TILE_SIZE, 40);
      ctx.fillStyle = isNight ? '#1e88e5' : '#90caf9'; ctx.fillRect(px + 4, py + 12, TILE_SIZE - 8, 32);
      break;
    case TileType.CHAIR:
      ctx.fillStyle = '#1565c0'; ctx.fillRect(px + 10, py + 18, 28, 16);
      ctx.fillStyle = '#263238'; ctx.fillRect(px + 20, py + 34, 8, 8);
      break;
    case TileType.PLANT:
      ctx.fillStyle = '#795548'; ctx.fillRect(px + 14, py + 28, 20, 14);
      break;
  }
}

export function drawTileTop(ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number, state: SystemState, tick: number, isNight = false) {
  const px = x * TILE_SIZE; const py = y * TILE_SIZE;
  const c = STATE_COLORS[state];
  switch (tile) {
    case TileType.SERVER: case TileType.RACK: case TileType.SERVER_LARGE:
      ctx.fillStyle = '#37474f'; ctx.fillRect(px + 4, py - 4, TILE_SIZE - 8, 18);
      break;
    case TileType.MONITOR:
      ctx.fillStyle = '#263238'; ctx.fillRect(px + 8, py + 2, TILE_SIZE - 16, 22);
      break;
    case TileType.LAPTOP:
      ctx.fillStyle = '#263238'; ctx.fillRect(px + 10, py + 10, 28, 16);
      break;
    case TileType.CHAIR:
      ctx.fillStyle = '#1565c0'; ctx.fillRect(px + 10, py + 6, 28, 18);
      break;
    case TileType.PLANT:
      ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.arc(px + 24, py + 16, 14, 0, Math.PI * 2); ctx.fill();
      break;
    case TileType.WALL_TOP: case TileType.WALL_LEFT: case TileType.WALL_RIGHT: case TileType.WALL_BOTTOM:
    case TileType.CORNER_TL: case TileType.CORNER_TR: case TileType.CORNER_BL: case TileType.CORNER_BR:
      ctx.fillStyle = c.wallMain; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = c.wallDark; ctx.fillRect(px, py + TILE_SIZE - 8, TILE_SIZE, 8);
      ctx.strokeStyle = c.wallLight; ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      break;
  }
}

export function drawTileLights(ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number, state: SystemState, tick: number, isNight = false) {
  const px = x * TILE_SIZE; const py = y * TILE_SIZE;
  switch (tile) {
    case TileType.SERVER: case TileType.RACK: case TileType.SERVER_LARGE:
      for (let i = 0; i < 4; i++) {
        const on = (Math.sin(tick * 0.3 + i + x) > 0);
        if (on) {
          const ledColor = state === SystemState.FIRE ? '#f44336' : '#4caf50';
          if (isNight) { ctx.shadowBlur = 8; ctx.shadowColor = ledColor; }
          ctx.fillStyle = ledColor; ctx.fillRect(px + 10 + i * 8, py + 4, 4, 4);
          ctx.shadowBlur = 0;
        }
      }
      break;
    case TileType.MONITOR:
      const screenColor = '#81d4fa';
      if (isNight) { ctx.shadowBlur = 12; ctx.shadowColor = screenColor; }
      ctx.fillStyle = screenColor; ctx.fillRect(px + 12, py + 6, TILE_SIZE - 24, 14);
      ctx.shadowBlur = 0;
      break;
    case TileType.LAPTOP:
      const lapColor = '#81d4fa';
      if (isNight) { ctx.shadowBlur = 10; ctx.shadowColor = lapColor; }
      ctx.fillStyle = lapColor; ctx.fillRect(px + 12, py + 12, 24, 10);
      ctx.shadowBlur = 0;
      break;
  }
}

export function drawTrendGraph(ctx: CanvasRenderingContext2D, x: number, y: number, history: number[]) {
  const w = 140; const h = 60;
  ctx.fillStyle = 'rgba(38, 50, 56, 0.95)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#90a4ae'; ctx.strokeRect(x, y, w, h);
  if (history.length < 2) return;
  ctx.beginPath(); ctx.strokeStyle = '#03a9f4'; ctx.lineWidth = 2;
  const step = w / (history.length - 1);
  for (let i = 0; i < history.length; i++) {
    const px = x + i * step; const py = y + h - (history[i] / 100) * h;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '8px "Press Start 2P"'; ctx.fillText('METRICS', x + 5, y - 5);
}

export function drawSmoke(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  ctx.fillStyle = 'rgba(120,144,156,0.6)';
  const oy = -((tick * 0.4) % 60);
  ctx.beginPath(); ctx.arc(x, y + oy, 14 + Math.sin(tick * 0.1) * 4, 0, Math.PI * 2); ctx.fill();
}

export function drawFire(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  const phase = tick * 0.3;
  ctx.save(); ctx.translate(x, y);
  for (let i = 0; i < 3; i++) {
    const size = 10 + Math.sin(phase + i) * 8;
    const offX = Math.sin(phase * 0.8 + i) * 10;
    const offY = -i * 12;
    ctx.fillStyle = i === 0 ? '#ff5722' : (i === 1 ? '#ff9800' : '#ffeb3b');
    ctx.beginPath(); ctx.moveTo(offX, offY); ctx.lineTo(offX - size, offY + size * 1.5); ctx.lineTo(offX + size, offY + size * 1.5); ctx.fill();
  }
  ctx.restore();
}

export function drawCat(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  const px = x * TILE_SIZE; const py = y * TILE_SIZE;
  const bounce = Math.abs(Math.sin(tick * 0.2)) * 3;
  ctx.save(); ctx.translate(px + 24, py + 36 - bounce);
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(-10, 0, 20, 10); // body
  ctx.fillRect(-12, -8, 8, 8); // head
  ctx.fillRect(-12, -10, 2, 2); ctx.fillRect(-6, -10, 2, 2); // ears
  ctx.fillStyle = '#9ece6a'; ctx.fillRect(-10, -6, 2, 2); ctx.fillRect(-6, -6, 2, 2); // eyes
  ctx.restore();
}

export function drawAgentBody(ctx: CanvasRenderingContext2D, agent: Agent, state: SystemState, _tick: number) {
  if (agent.id === 'easter-cat') { drawCat(ctx, agent.x, agent.y, performance.now() * 0.06); return; }
  const t = performance.now() * 0.06; // Standard animation time
  const px = agent.x * TILE_SIZE; const py = agent.y * TILE_SIZE;
  const isWalking = !agent.isSitting && (agent.x !== agent.targetX || agent.y !== agent.targetY);
  
  // Dynamic bounce/breath
  const bounce = isWalking ? Math.abs(Math.sin(t * 0.2)) * 4 : Math.sin(t * 0.1) * 2;
  const walkPhase = t * 0.15;
  const bodyWidth = agent.bodyType === 'large' ? 32 : (agent.bodyType === 'slim' ? 18 : 24);
  const bodyX = px + (TILE_SIZE - bodyWidth) / 2;
  
  let ay = py - bounce; 
  if (agent.isSitting) ay += 8;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; 
  ctx.beginPath(); 
  ctx.ellipse(px + 24, py + 44, 12, 6, 0, 0, Math.PI * 2); 
  ctx.fill();

  // Legs
  ctx.fillStyle = '#263238'; 
  const legOffset = isWalking ? Math.sin(walkPhase) * 6 : 0;
  ctx.fillRect(bodyX + 2, ay + 36, 8, 10 + legOffset); 
  ctx.fillRect(bodyX + bodyWidth - 10, ay + 36, 8, 10 - legOffset);

  // Shirt
  ctx.fillStyle = ROLE_SHIRT_COLORS[agent.role] || '#fff'; 
  ctx.fillRect(bodyX, ay + 24, bodyWidth, 14);

  // Arms
  const armSwing = isWalking ? Math.sin(walkPhase) * 8 : (Math.sin(t * 0.1) * 2);
  ctx.fillStyle = agent.skinColor;
  if (agent.isSitting) { 
    ctx.fillRect(bodyX - 4, ay + 20 + armSwing, 6, 6); 
    ctx.fillRect(bodyX + bodyWidth - 2, ay + 20 - armSwing, 6, 6); 
  } else { 
    ctx.fillRect(bodyX - 6, ay + 24 + armSwing, 8, 8); 
    ctx.fillRect(bodyX + bodyWidth - 2, ay + 24 - armSwing, 8, 8); 
  }

  // Head
  ctx.fillStyle = agent.skinColor; 
  ctx.fillRect(px + 14, ay + 6, 20, 18);

  // Apply TBT Stutter (Metaphor: main thread blocked)
  // If TBT is high, we simulate lag by snapping the position
  const tbtScore = agent.metadata?.tbtScore || 100;
  if (tbtScore < 80 && !agent.isSitting) {
    const lagFactor = Math.floor((100 - tbtScore) / 10);
    if (Math.floor(t * 0.5) % (12 - lagFactor) === 0) {
      ctx.fillStyle = 'rgba(247, 118, 142, 0.3)';
      ctx.fillRect(px + 10, ay + 2, 28, 40);
    }
  }

  // Hair
  ctx.fillStyle = agent.hairColor;
  if (agent.isWoman) { 
    ctx.fillRect(px + 10, ay + 4, 28, 8); 
    ctx.fillRect(px + 10, ay + 12, 4, 12); 
    ctx.fillRect(px + 34, ay + 12, 4, 12); 
  } else { 
    ctx.fillRect(px + 12, ay + 4, 24, 8); 
  }

  // Eyes
  if (agent.direction !== 'up') {
    ctx.fillStyle = '#263238'; 
    const ey = ay + 14;
    if (agent.direction === 'down') { 
      ctx.fillRect(px + 18, ey, 4, 4); 
      ctx.fillRect(px + 26, ey, 4, 4); 
    } else if (agent.direction === 'left') { 
      ctx.fillRect(px + 16, ey, 4, 4); 
    } else { 
      ctx.fillRect(px + 28, ey, 4, 4); 
    }
  }
}

export function drawDialogueBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.font = 'bold 12px sans-serif'; const m = ctx.measureText(text);
  const w = m.width + 16; const h = 24; const bx = x - w / 2; const by = y - h - 16;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#263238'; ctx.lineWidth = 2;
  ctx.fillRect(bx, by, w, h); ctx.strokeRect(bx, by, w, h);
  ctx.beginPath(); ctx.moveTo(x - 6, by + h); ctx.lineTo(x, by + h + 8); ctx.lineTo(x + 6, by + h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#263238'; ctx.textAlign = 'center'; ctx.fillText(text, x, by + h / 2 + 5); ctx.textAlign = 'start';
}

export function drawAgentDialogue(ctx: CanvasRenderingContext2D, agent: Agent, tick: number) {
  if (!agent.dialogue) return;
  const px = agent.x * TILE_SIZE; const py = agent.y * TILE_SIZE;
  const bounce = !agent.isSitting ? Math.abs(Math.sin(tick * 0.2)) * 4 : 0;
  let ay = py - bounce; if (agent.isSitting) ay += 8;
  drawDialogueBubble(ctx, px + TILE_SIZE / 2, ay, agent.dialogue);
}

export function drawAgentMiniature(ctx: CanvasRenderingContext2D, agent: Agent, x: number, y: number, size: number) {
  const scale = size / 48; ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = agent.skinColor; ctx.fillRect(14, 6, 20, 20);
  ctx.fillStyle = ROLE_SHIRT_COLORS[agent.role] || '#fff'; ctx.fillRect(12, 26, 24, 18);
  ctx.fillStyle = agent.hairColor;
  if (agent.isWoman) { ctx.fillRect(10, 4, 28, 8); } else { ctx.fillRect(12, 4, 24, 10); }
  ctx.restore();
}

export function getAgentMiniatureDataUrl(agent: Agent): string {
  const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  drawAgentMiniature(ctx, agent, 0, 0, 32);
  return canvas.toDataURL();
}
export function drawMetricHighlight(ctx: CanvasRenderingContext2D, metric: string, x: number, y: number, tick: number) {
  const px = x * TILE_SIZE; const py = y * TILE_SIZE;
  const color = HIGHLIGHT_COLORS[metric] || '#fff';
  const alpha = 0.3 + Math.abs(Math.sin(tick * 0.1)) * 0.4;
  
  ctx.save();
  ctx.shadowBlur = 20; ctx.shadowColor = color;
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.lineDashOffset = -tick;
  ctx.strokeRect(px - 4, py - 4, TILE_SIZE + 8, TILE_SIZE + 8);
  ctx.fillStyle = `rgba(${parseInt(color.slice(1,3), 16)}, ${parseInt(color.slice(3,5), 16)}, ${parseInt(color.slice(5,7), 16)}, ${alpha * 0.2})`;
  ctx.fillRect(px - 4, py - 4, TILE_SIZE + 8, TILE_SIZE + 8);
  ctx.restore();
}

export function drawLCPWeight(ctx: CanvasRenderingContext2D, x: number, y: number, score: number, tick: number) {
  const px = x * TILE_SIZE; const py = y * TILE_SIZE;
  const severity = (100 - score) / 100;
  const shake = Math.sin(tick * 0.5) * (severity * 5);
  
  // Draw huge "Heavy Data" crate
  ctx.fillStyle = '#24283b'; ctx.fillRect(px + shake, py - 10, TILE_SIZE * 1.5, TILE_SIZE + 10);
  ctx.strokeStyle = '#7aa2f7'; ctx.lineWidth = 2; ctx.strokeRect(px + shake, py - 10, TILE_SIZE * 1.5, TILE_SIZE + 10);
  
  // Straps
  ctx.fillStyle = '#e0af68'; ctx.fillRect(px + shake + 10, py - 10, 5, TILE_SIZE + 10);
  ctx.fillRect(px + shake + TILE_SIZE, py - 10, 5, TILE_SIZE + 10);
  
  // Icon
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText("LCP", px + shake + 15, py + 15);
}

export function applyCLSJitter(ctx: CanvasRenderingContext2D, score: number, tick: number) {
  const severity = (100 - score) / 100;
  if (severity < 0.1) return;
  
  const jitterX = Math.sin(tick * 0.2) * (severity * 20);
  const jitterY = Math.cos(tick * 0.25) * (severity * 10);
  ctx.translate(jitterX, jitterY);
}
