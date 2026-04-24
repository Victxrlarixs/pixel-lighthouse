// ============================================================
// GBA Pokémon-style Pixel Art Sprites — ULTRA POLISH
// ============================================================

import { TileType, SystemState, AgentRole, type Agent } from '../core/types';

export const TILE_SIZE = 48;

const STATE_COLORS = {
  [SystemState.STABLE]: { accent: '#7aa2f7', bg: '#1a1b26', floor1: '#cfd8dc', floor2: '#eceff1', wallMain: '#90a4ae', wallDark: '#455a64', wallLight: '#cfd8dc' },
  [SystemState.CHAOS]: { accent: '#e0af68', bg: '#1a1b26', floor1: '#cfd8dc', floor2: '#eceff1', wallMain: '#90a4ae', wallDark: '#455a64', wallLight: '#cfd8dc' },
  [SystemState.FIRE]: { accent: '#f7768e', bg: '#1a1b26', floor1: '#cfd8dc', floor2: '#eceff1', wallMain: '#90a4ae', wallDark: '#455a64', wallLight: '#cfd8dc' },
};

const ROLE_SHIRT_COLORS: Record<string, string> = {
  [AgentRole.PERFORMANCE_LEAD]: '#7aa2f7',
  [AgentRole.SRE]: '#bb9af7',
  [AgentRole.INFRA_ENGINEER]: '#9ece6a',
  [AgentRole.NETWORK_SPECIALIST]: '#f7768e',
  [AgentRole.SYSTEM_ANALYST]: '#7dcfff',
  [AgentRole.DBA]: '#e0af68',
  [AgentRole.FIREFIGHTER]: '#ff9e64'
};

export function drawTile(ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number, state: SystemState, tick: number) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const c = STATE_COLORS[state];

  // Base Floor
  ctx.fillStyle = (x + y) % 2 === 0 ? c.floor1 : c.floor2;
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  switch (tile) {
    case TileType.WALL_TOP:
    case TileType.CORNER_TL:
    case TileType.CORNER_TR:
      ctx.fillStyle = c.wallMain; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = c.wallDark; ctx.fillRect(px, py + TILE_SIZE - 8, TILE_SIZE, 8);
      ctx.strokeStyle = c.wallLight; ctx.strokeRect(px+1, py+1, TILE_SIZE-2, TILE_SIZE-2);
      break;

    case TileType.WALL_LEFT:
    case TileType.WALL_RIGHT:
    case TileType.WALL_BOTTOM:
    case TileType.CORNER_BL:
    case TileType.CORNER_BR:
      ctx.fillStyle = c.wallMain; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = c.wallLight; ctx.strokeRect(px+1, py+1, TILE_SIZE-2, TILE_SIZE-2);
      break;

    case TileType.SERVER:
    case TileType.SERVER_LARGE:
      ctx.fillStyle = '#1a1b26'; ctx.fillRect(px + 4, py + 12, TILE_SIZE - 8, TILE_SIZE - 12);
      ctx.fillStyle = '#37474f'; ctx.fillRect(px + 4, py - 4, TILE_SIZE - 8, 18);
      // Lights
      const ledColor = state === SystemState.FIRE ? '#f7768e' : '#9ece6a';
      for (let i = 0; i < 4; i++) {
        if (Math.sin(tick * 0.3 + i + x) > 0) {
          ctx.fillStyle = ledColor; ctx.fillRect(px + 10 + i * 8, py + 4, 4, 4);
        }
      }
      break;

    case TileType.RACK:
      ctx.fillStyle = '#263238'; ctx.fillRect(px + 6, py + 16, TILE_SIZE - 12, TILE_SIZE - 16);
      ctx.fillStyle = '#37474f'; ctx.fillRect(px + 6, py + 4, TILE_SIZE - 12, 12);
      break;

    case TileType.MONITOR:
    case TileType.WALL_MONITOR:
      ctx.fillStyle = '#5d4037'; ctx.fillRect(px + 2, py + 24, TILE_SIZE - 4, 12);
      ctx.fillStyle = '#263238'; ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, 18);
      ctx.fillStyle = '#81d4fa'; ctx.fillRect(px + 12, py + 12, TILE_SIZE - 24, 10);
      break;

    case TileType.PLANT:
      ctx.fillStyle = '#5d4037'; ctx.fillRect(px + 14, py + 24, 20, 12);
      ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.arc(px + 24, py + 18, 14, 0, Math.PI * 2); ctx.fill();
      break;

    case TileType.CHAIR:
      ctx.fillStyle = '#37474f'; ctx.fillRect(px + 12, py + 24, 24, 14);
      break;

    case TileType.CARPET:
      ctx.fillStyle = 'rgba(122, 162, 247, 0.1)'; ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      break;

    case TileType.FIRE_EXTINGUISHER:
      ctx.fillStyle = '#f7768e'; ctx.fillRect(px + 18, py + 12, 12, 24);
      ctx.fillStyle = '#fff'; ctx.fillRect(px + 18, py + 20, 12, 4);
      break;
      
    case TileType.COFFEE_MACHINE:
      ctx.fillStyle = '#37474f'; ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
      ctx.fillStyle = '#1a1b26'; ctx.fillRect(px + 12, py + 24, 24, 8);
      break;
  }
}

export function drawTileLights(ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number, state: SystemState, tick: number, isNight: boolean) {
  if (!isNight) return;
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;

  switch (tile) {
    case TileType.SERVER:
    case TileType.SERVER_LARGE:
      const ledColor = state === SystemState.FIRE ? '#f7768e' : '#9ece6a';
      ctx.shadowBlur = 15; ctx.shadowColor = ledColor;
      for (let i = 0; i < 4; i++) {
        if (Math.sin(tick * 0.3 + i + x) > 0) {
          ctx.fillStyle = ledColor; ctx.fillRect(px + 10 + i * 8, py + 4, 4, 4);
        }
      }
      ctx.shadowBlur = 0;
      break;
    case TileType.MONITOR:
    case TileType.WALL_MONITOR:
      ctx.shadowBlur = 20; ctx.shadowColor = '#81d4fa';
      ctx.fillStyle = '#81d4fa'; ctx.fillRect(px + 12, py + 12, TILE_SIZE - 24, 10);
      ctx.shadowBlur = 0;
      break;
  }
}

export function drawAgentBody(ctx: CanvasRenderingContext2D, agent: Agent, _state: SystemState) {
  const t = performance.now() * 0.06;
  const px = agent.x * TILE_SIZE; const py = agent.y * TILE_SIZE;
  const isWalking = !agent.isSitting && (Math.abs(agent.x - agent.targetX) > 0.01 || Math.abs(agent.y - agent.targetY) > 0.01);
  const bounce = isWalking ? Math.abs(Math.sin(t * 0.2)) * 4 : Math.sin(t * 0.1) * 2;
  const bodyWidth = agent.bodyType === 'large' ? 32 : 24;
  const bodyX = px + (TILE_SIZE - bodyWidth) / 2;
  let ay = py - bounce; if (agent.isSitting) ay += 8;

  ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.ellipse(px + 24, py + 42, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ROLE_SHIRT_COLORS[agent.role] || '#fff'; ctx.fillRect(bodyX, ay + 22, bodyWidth, 16);
  ctx.fillStyle = agent.skinColor; ctx.fillRect(px + 14, ay + 4, 20, 20);
}

export function drawAgentDialogue(ctx: CanvasRenderingContext2D, agent: Agent, _tick: number) {
  if (!agent.dialogue) return;
  const px = agent.x * TILE_SIZE; const py = agent.y * TILE_SIZE;
  ctx.font = 'bold 11px sans-serif';
  const textWidth = ctx.measureText(agent.dialogue).width;
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(px + 24 - (textWidth/2 + 5), py - 35, textWidth + 10, 20);
  ctx.fillStyle = '#000'; ctx.fillText(agent.dialogue, px + 24 - textWidth/2, py - 21);
}

export function drawSmoke(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  ctx.fillStyle = 'rgba(120,144,156,0.5)';
  const oy = -((tick * 0.4) % 60);
  ctx.beginPath(); ctx.arc(x, y + oy, 12 + Math.sin(tick * 0.1) * 4, 0, Math.PI * 2); ctx.fill();
}

export function drawFire(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  const size = 8 + Math.sin(tick * 0.3) * 6;
  ctx.fillStyle = '#f7768e'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - size, y + size * 1.5); ctx.lineTo(x + size, y + size * 1.5); ctx.fill();
}

export function drawTrendGraph(ctx: CanvasRenderingContext2D, x: number, y: number, history: number[]) {
  const w = 140; const h = 60;
  ctx.fillStyle = 'rgba(26, 27, 38, 0.9)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(122, 162, 247, 0.4)'; ctx.strokeRect(x, y, w, h);
  if (history.length < 2) return;
  ctx.beginPath(); ctx.strokeStyle = '#7aa2f7'; ctx.lineWidth = 2;
  history.forEach((val, i) => {
    const lx = x + (i / 19) * w; const ly = y + h - (val / 100) * h;
    if (i === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly);
  });
  ctx.stroke(); ctx.lineWidth = 1;
}
