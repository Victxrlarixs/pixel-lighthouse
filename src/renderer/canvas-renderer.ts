// ============================================================
// Canvas Renderer — RESTORING ORIGINAL LOGIC
// ============================================================

import { type SystemSnapshot, type Agent, SystemState } from '../core/types';
import { DATA_CENTER_MAP, MAP_COLS, MAP_ROWS } from './map';
import { 
  drawTile,
  drawTileLights,
  drawAgentBody, 
  drawAgentDialogue,
  drawSmoke, 
  drawFire,
  drawTrendGraph,
  TILE_SIZE 
} from './sprites';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tick = 0;
  private scale = 1.1;
  public isNightMode = false;
  public isFeverMode = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.canvas.width = Math.floor(MAP_COLS * TILE_SIZE * this.scale);
    this.canvas.height = Math.floor(MAP_ROWS * TILE_SIZE * this.scale);
    this.ctx.imageSmoothingEnabled = false;
  }

  setNightMode(on: boolean) { this.isNightMode = on; }
  setFeverMode(on: boolean) { this.isFeverMode = on; }

  render(snapshot: SystemSnapshot, agents: Agent[], history: number[]) {
    this.tick++;
    const { ctx } = this;
    const { state } = snapshot;

    ctx.save();
    if (state === SystemState.FIRE) ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
    ctx.scale(this.scale, this.scale);

    // 1. Draw Map Tiles
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        drawTile(ctx, DATA_CENTER_MAP[row][col], col, row, state, this.tick);
      }
    }

    // 2. Draw Agents
    const sorted = [...agents].sort((a, b) => a.y - b.y);
    for (const agent of sorted) {
      drawAgentBody(ctx, agent, state);
    }

    // 3. Draw Hardware Lights Pass
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        drawTileLights(ctx, DATA_CENTER_MAP[row][col], col, row, state, this.tick, this.isNightMode);
      }
    }

    // 4. Overlays
    if (this.isFeverMode) {
      const hue = (this.tick * 2) % 360;
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.15)`;
      ctx.fillRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    } else if (this.isNightMode) {
      ctx.fillStyle = 'rgba(0, 0, 30, 0.65)';
      ctx.fillRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
      // Re-draw lights pass over the dark overlay
      for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
          drawTileLights(ctx, DATA_CENTER_MAP[row][col], col, row, state, this.tick, true);
        }
      }
    }

    // 5. UI Elements
    for (const agent of agents) drawAgentDialogue(ctx, agent, this.tick);
    if (state === SystemState.FIRE || state === SystemState.CHAOS) this.renderEmergencyEffects(state);
    drawTrendGraph(ctx, 10, MAP_ROWS * TILE_SIZE - 75, history);

    ctx.restore();
    this.drawScanlines();
  }

  renderIdle(agents: Agent[], tick: number, isScanning: boolean, history: number[]) {
    this.tick = tick;
    this.render({ state: SystemState.STABLE, metrics: { performanceScore: 100 } } as any, agents, history);

    if (!isScanning) {
      const { ctx } = this;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, this.canvas.height / 2 - 60, this.canvas.width, 120);
      ctx.fillStyle = '#fff'; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
      ctx.fillText('AWAITING SYSTEM URL...', this.canvas.width / 2, this.canvas.height / 2 - 15);
      ctx.font = '12px "Press Start 2P"';
      ctx.fillText('STATION IDLE — READY FOR AUDIT', this.canvas.width / 2, this.canvas.height / 2 + 25);
    }
  }

  private renderEmergencyEffects(state: SystemState) {
    const { ctx } = this;
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        if (DATA_CENTER_MAP[row][col] === 1 /* SERVER */ && Math.random() > 0.9) {
          if (state === SystemState.FIRE) drawFire(ctx, col * TILE_SIZE + 24, row * TILE_SIZE + 10, this.tick);
          drawSmoke(ctx, col * TILE_SIZE + 24, row * TILE_SIZE, this.tick);
        }
      }
    }
  }

  private drawScanlines() {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let y = 0; y < this.canvas.height; y += 4) ctx.fillRect(0, y, this.canvas.width, 2);
  }
}
