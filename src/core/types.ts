/**
 * Core domain types for the Pixel Insights simulation.
 */

export enum TileType {
  FLOOR = 0,
  WALL_TOP = 1,
  WALL_LEFT = 2,
  WALL_RIGHT = 3,
  WALL_BOTTOM = 4,
  CORNER_TL = 5,
  CORNER_TR = 6,
  CORNER_BL = 7,
  CORNER_BR = 8,
  SERVER = 9,
  RACK = 10,
  DESK = 11,
  CHAIR = 12,
  PLANT = 13,
  CABLE_H = 16,
  MONITOR = 17,
  LAPTOP = 18,
  SLIDING_DOOR = 19,
  SERVER_LARGE = 20,
  COFFEE_MACHINE = 21,
}

export enum SystemState {
  STABLE = "STABLE",
  WARNING = "WARNING",
  CHAOS = "CHAOS",
  FIRE = "FIRE",
}

export enum AgentRole {
  PERFORMANCE_LEAD = "Lead Performance Eng",
  SRE = "SRE Architect",
  INFRA_ENGINEER = "Infrastructure Specialist",
  NETWORK_SPECIALIST = "Net Engineer",
  SYSTEM_ANALYST = "Data Analyst",
  DBA = "DBA",
  FIREFIGHTER = "Firefighter",
}

export enum AgentState {
  IDLE = "IDLE",
  WORKING = "WORKING",
  RUNNING = "RUNNING",
  SCANNING = "SCANNING",
  COFFEE_BREAK = "COFFEE_BREAK",
}

export interface AgentMetadata {
  mood?: "chaos" | "fire" | "happy" | "working" | "coffee" | null;
  taskTimer: number;
  tbtScore?: number;
}

export interface Agent {
  id: string;
  role: AgentRole;
  state: AgentState;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  animationFrame: number;
  direction: "down" | "up" | "left" | "right";
  dialogue?: string;
  dialogueTimer: number;
  isSitting: boolean;
  homeX: number;
  homeY: number;
  skinColor: string;
  hairColor: string;
  bodyType: "slim" | "normal" | "large";
  isWoman: boolean;
  metadata: AgentMetadata;
}

export interface PerformanceMetrics {
  performanceScore: number;
  fcp: number;
  lcp: number;
  cls: number;
  tbt: number;
  timestamp: number;
  url: string;
}

export interface SystemSnapshot {
  metrics: PerformanceMetrics;
  state: SystemState;
}
