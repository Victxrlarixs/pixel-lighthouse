// ============================================================
// Tile Rendering Sprites
// ============================================================

import { TileType, SystemState, type Agent } from "../core/types";
import { TILE_SIZE, STATE_COLORS } from "./render-constants";

export function drawFloor(
  ctx: CanvasRenderingContext2D,
  tile: TileType,
  x: number,
  y: number,
  state: SystemState,
) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const c = STATE_COLORS[state];
  ctx.fillStyle = (x + y) % 2 === 0 ? c.floor1 : c.floor2;
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  if (tile === TileType.CARPET) {
    ctx.fillStyle = "#b0bec5";
    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  } else if (tile === TileType.CABLE_H) {
    ctx.fillStyle = "#263238";
    ctx.fillRect(px, py + 16, TILE_SIZE, 16);
    ctx.fillStyle = "#03a9f4";
    ctx.fillRect(px, py + 20, TILE_SIZE, 4);
  }
}

export function drawTileBase(
  ctx: CanvasRenderingContext2D,
  tile: TileType,
  x: number,
  y: number,
  state: SystemState,
  agents: Agent[],
  tick: number,
  isNight = false,
) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  switch (tile) {
    case TileType.SERVER:
    case TileType.RACK:
    case TileType.SERVER_LARGE:
      ctx.fillStyle = "#1a1b26";
      ctx.fillRect(px + 4, py + 12, TILE_SIZE - 8, TILE_SIZE - 12);
      break;
    case TileType.DESK:
    case TileType.MONITOR:
    case TileType.LAPTOP:
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(px + 2, py + 16, TILE_SIZE - 4, 16);
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(px + 4, py + 30, 6, 12);
      ctx.fillRect(px + TILE_SIZE - 10, py + 30, 6, 12);
      break;
    case TileType.SLIDING_DOOR:
      ctx.fillStyle = "#37474f";
      ctx.fillRect(px, py + 8, TILE_SIZE, 40);
      ctx.fillStyle = isNight ? "#1e88e5" : "#90caf9";
      ctx.fillRect(px + 4, py + 12, TILE_SIZE - 8, 32);
      break;
    case TileType.CHAIR:
      ctx.fillStyle = "#1565c0";
      ctx.fillRect(px + 10, py + 18, 28, 16);
      ctx.fillStyle = "#263238";
      ctx.fillRect(px + 20, py + 34, 8, 8);
      break;
    case TileType.PLANT:
      ctx.fillStyle = "#795548";
      ctx.fillRect(px + 14, py + 28, 20, 14);
      break;
  }
}

export function drawTileTop(
  ctx: CanvasRenderingContext2D,
  tile: TileType,
  x: number,
  y: number,
  state: SystemState,
  tick: number,
  isNight = false,
) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const c = STATE_COLORS[state];
  switch (tile) {
    case TileType.SERVER:
    case TileType.RACK:
    case TileType.SERVER_LARGE:
      ctx.fillStyle = "#37474f";
      ctx.fillRect(px + 4, py - 4, TILE_SIZE - 8, 18);
      break;
    case TileType.MONITOR:
      ctx.fillStyle = "#263238";
      ctx.fillRect(px + 8, py + 2, TILE_SIZE - 16, 22);
      break;
    case TileType.LAPTOP:
      ctx.fillStyle = "#263238";
      ctx.fillRect(px + 10, py + 10, 28, 16);
      break;
    case TileType.CHAIR:
      ctx.fillStyle = "#1565c0";
      ctx.fillRect(px + 10, py + 6, 28, 18);
      break;
    case TileType.PLANT:
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(px + 24, py + 16, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
    case TileType.WALL_TOP:
    case TileType.WALL_LEFT:
    case TileType.WALL_RIGHT:
    case TileType.WALL_BOTTOM:
    case TileType.CORNER_TL:
    case TileType.CORNER_TR:
    case TileType.CORNER_BL:
    case TileType.CORNER_BR:
      ctx.fillStyle = c.wallMain;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = c.wallDark;
      ctx.fillRect(px, py + TILE_SIZE - 8, TILE_SIZE, 8);
      ctx.strokeStyle = c.wallLight;
      ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      break;
    case TileType.SOFA:
      ctx.fillStyle = "#455a64"; // Sofa base
      ctx.fillRect(px + 2, py + 10, TILE_SIZE - 4, TILE_SIZE - 14);
      ctx.fillStyle = "#607d8b"; // Backrest
      ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, 12);
      ctx.fillStyle = "#37474f"; // Arms
      ctx.fillRect(px + 2, py + 14, 6, 20);
      ctx.fillRect(px + TILE_SIZE - 8, py + 14, 6, 20);
      break;
  }
}

export function drawTileLights(
  ctx: CanvasRenderingContext2D,
  tile: TileType,
  x: number,
  y: number,
  state: SystemState,
  tick: number,
  isNight = false,
) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  switch (tile) {
    case TileType.SERVER:
    case TileType.RACK:
    case TileType.SERVER_LARGE:
      for (let i = 0; i < 4; i++) {
        const on = Math.sin(tick * 0.3 + i + x) > 0;
        if (on) {
          const ledColor = state === SystemState.FIRE ? "#f44336" : "#4caf50";
          if (isNight) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = ledColor;
          }
          ctx.fillStyle = ledColor;
          ctx.fillRect(px + 10 + i * 8, py + 4, 4, 4);
          ctx.shadowBlur = 0;
        }
      }
      break;
    case TileType.MONITOR:
      const screenColor = "#81d4fa";
      if (isNight) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = screenColor;
      }
      ctx.fillStyle = screenColor;
      ctx.fillRect(px + 12, py + 6, TILE_SIZE - 24, 14);
      ctx.shadowBlur = 0;
      break;
    case TileType.LAPTOP:
      const lapColor = "#81d4fa";
      if (isNight) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = lapColor;
      }
      ctx.fillStyle = lapColor;
      ctx.fillRect(px + 12, py + 12, 24, 10);
      ctx.shadowBlur = 0;
      break;
  }
}
