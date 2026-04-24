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
  CARPET = 14,
  CABLE_V = 15,
  CABLE_H = 16,
  MONITOR = 17,
  LAPTOP = 18,
  SLIDING_DOOR = 19,
  SERVER_LARGE = 20,
  SOFA = 21,
}

export enum SystemState {
  STABLE = "STABLE",
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
  ALERT = "ALERT",
  RUNNING = "RUNNING",
  FIREFIGHTING = "FIREFIGHTING",
  SCANNING = "SCANNING",
  MOVING = "MOVING",
}

export interface AgentMetadata {
  mood?: "chaos" | "fire" | "happy" | "working" | "coffee" | null;
  taskTimer: number;
  subState?: string;
  tbtScore?: number;
  wasScanning?: boolean;
}

export interface Agent {
  id: string;
  role: AgentRole;
  state: AgentState;
  currentTask: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  animationFrame: number;
  direction: "down" | "up" | "left" | "right";
  speed: number;
  dialogue?: string;
  dialogueTimer: number;
  isSitting: boolean;
  homeX: number;
  homeY: number;
  skinColor: string;
  hairColor: string;
  bodyType: "slim" | "normal" | "large";
  isWoman: boolean;
  bio?: string;
  skills?: string[];
  metadata: AgentMetadata;
}

export interface SystemEvent {
  id: string;
  timestamp: number;
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  category: string;
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
  activeEvents: SystemEvent[];
}
