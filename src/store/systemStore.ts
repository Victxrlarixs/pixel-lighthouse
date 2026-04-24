import { atom } from "nanostores";
import type { SystemSnapshot, Agent } from "../core/types";

/** Global state for the overall performance score */
export const $performanceScore = atom<number>(0);

/** Global state for the current system snapshot */
export const $systemSnapshot = atom<SystemSnapshot | null>(null);

/** Global state for the list of active agents */
export const $agents = atom<Agent[]>([]);

/** UI State: Night mode toggle */
export const $isNightMode = atom<boolean>(false);

/** UI State: Active scanning status */
export const $isScanning = atom<boolean>(false);

/** UI State: Performance score history for graphing */
export const $history = atom<number[]>([]);

/** UI State: Currently hovered metric key */
export const $hoveredMetric = atom<string | null>(null);

/** UI State: Currently selected metric key */
export const $selectedMetric = atom<string | null>(null);
