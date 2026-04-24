// ============================================================
// Data Center Map Layout — ULTRA POLISH
// Detailed architectural grid inspired by GBA Pokémon
// ============================================================

import { TileType } from '../core/types';

export const MAP_COLS = 18;
export const MAP_ROWS = 14;

export const DATA_CENTER_MAP: TileType[][] = [
  // Row 0-1 — Top Wall with Signage
  [TileType.CORNER_TL, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.WALL_TOP, TileType.CORNER_TR],
  [TileType.WALL_LEFT, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL_RIGHT],
  
  // Row 2-3 — Server Racks Top
  [TileType.WALL_LEFT, TileType.SERVER_LARGE, TileType.SERVER_LARGE, TileType.SERVER_LARGE, TileType.FLOOR, TileType.WALL_MONITOR, TileType.FLOOR, TileType.SERVER_LARGE, TileType.SERVER_LARGE, TileType.SERVER_LARGE, TileType.SERVER_LARGE, TileType.FLOOR, TileType.WALL_MONITOR, TileType.FLOOR, TileType.SERVER_LARGE, TileType.SERVER_LARGE, TileType.FLOOR, TileType.WALL_RIGHT],
  [TileType.WALL_LEFT, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL_RIGHT],
  
  // Row 4-5 — Mid Racks / Main Aisle
  [TileType.WALL_LEFT, TileType.RACK, TileType.RACK, TileType.RACK, TileType.FLOOR, TileType.RACK, TileType.RACK, TileType.RACK, TileType.FLOOR, TileType.RACK, TileType.RACK, TileType.RACK, TileType.FLOOR, TileType.RACK, TileType.RACK, TileType.RACK, TileType.FIRE_EXTINGUISHER, TileType.WALL_RIGHT],
  [TileType.WALL_LEFT, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.CABLE_H, TileType.FLOOR, TileType.WALL_RIGHT],
  
  // Row 6-7 — Core Infrastructure
  [TileType.WALL_LEFT, TileType.FLOOR, TileType.FLOOR, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.FLOOR, TileType.PLANT, TileType.WALL_RIGHT],
  [TileType.WALL_LEFT, TileType.FLOOR, TileType.FLOOR, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.CARPET, TileType.FLOOR, TileType.FLOOR, TileType.WALL_RIGHT],
  
  // Row 8-9 — Workspace Area
  [TileType.WALL_LEFT, TileType.MONITOR, TileType.MONITOR, TileType.MONITOR, TileType.FLOOR, TileType.MONITOR, TileType.MONITOR, TileType.MONITOR, TileType.FLOOR, TileType.MONITOR, TileType.MONITOR, TileType.MONITOR, TileType.FLOOR, TileType.MONITOR, TileType.MONITOR, TileType.MONITOR, TileType.FLOOR, TileType.WALL_RIGHT],
  [TileType.WALL_LEFT, TileType.CHAIR, TileType.CHAIR, TileType.CHAIR, TileType.FLOOR, TileType.CHAIR, TileType.CHAIR, TileType.CHAIR, TileType.FLOOR, TileType.CHAIR, TileType.CHAIR, TileType.CHAIR, TileType.FLOOR, TileType.CHAIR, TileType.CHAIR, TileType.CHAIR, TileType.FLOOR, TileType.WALL_RIGHT],
  
  // Row 10-11 — Break Area / Storage
  [TileType.WALL_LEFT, TileType.COFFEE_MACHINE, TileType.FLOOR, TileType.WATER_COOLER, TileType.FLOOR, TileType.BOXES, TileType.BOXES, TileType.FLOOR, TileType.WHITEBOARD, TileType.FLOOR, TileType.WASTE_BIN, TileType.FLOOR, TileType.MONITOR, TileType.MONITOR, TileType.FLOOR, TileType.PLANT, TileType.FLOOR, TileType.WALL_RIGHT],
  [TileType.WALL_LEFT, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.CHAIR, TileType.CHAIR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL_RIGHT],
  
  // Row 12-13 — Entrance / Exit
  [TileType.WALL_LEFT, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.SLIDING_DOOR, TileType.SLIDING_DOOR, TileType.SLIDING_DOOR, TileType.SLIDING_DOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL_RIGHT],
  [TileType.CORNER_BL, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.WALL_BOTTOM, TileType.CORNER_BR],
];
