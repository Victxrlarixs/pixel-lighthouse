import { SystemState, AgentRole } from "../core/types";

export const TILE_SIZE = 48;

/** Theme color definitions for different system states */
export const STATE_COLORS = {
  [SystemState.STABLE]: {
    accent: "#7aa2f7",
    bg: "#1a1b26",
    floor1: "#cfd8dc",
    floor2: "#eceff1",
    wallMain: "#90a4ae",
    wallDark: "#455a64",
    wallLight: "#cfd8dc",
  },
  [SystemState.CHAOS]: {
    accent: "#e0af68",
    bg: "#1a1b26",
    floor1: "#cfd8dc",
    floor2: "#eceff1",
    wallMain: "#90a4ae",
    wallDark: "#455a64",
    wallLight: "#cfd8dc",
  },
  [SystemState.FIRE]: {
    accent: "#f7768e",
    bg: "#1a1b26",
    floor1: "#cfd8dc",
    floor2: "#eceff1",
    wallMain: "#90a4ae",
    wallDark: "#455a64",
    wallLight: "#cfd8dc",
  },
};

/** Palette for specific performance metrics */
export const HIGHLIGHT_COLORS: Record<string, string> = {
  LCP: "#f7768e",
  FCP: "#7aa2f7",
  TBT: "#e0af68",
  CLS: "#9ece6a",
};

/** Mapping of agent roles to their uniform colors */
export const ROLE_SHIRT_COLORS: Record<string, string> = {
  [AgentRole.PERFORMANCE_LEAD]: "#7aa2f7",
  [AgentRole.SRE]: "#bb9af7",
  [AgentRole.INFRA_ENGINEER]: "#9ece6a",
  [AgentRole.NETWORK_SPECIALIST]: "#f7768e",
  [AgentRole.SYSTEM_ANALYST]: "#7dcfff",
  [AgentRole.DBA]: "#e0af68",
  [AgentRole.FIREFIGHTER]: "#ff9e64",
};

/**
 * Gets the color palette for a given system state.
 * @param state - The current system state.
 */
export function getStateColors(state: SystemState) {
  return STATE_COLORS[state];
}
