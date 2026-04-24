import { atom, computed } from 'nanostores';
import type { SystemSnapshot, Agent, SystemState } from '../core/types';

// Raw Simulation State
export const $performanceScore = atom<number>(100);
export const $systemSnapshot = atom<SystemSnapshot | null>(null);
export const $agents = atom<Agent[]>([]);
export const $isNightMode = atom<boolean>(false);
export const $isScanning = atom<boolean>(false);
export const $scanProgress = atom<number>(0);
export const $history = atom<number[]>([]);

// NEW: Interactive State
export const $hoveredMetric = atom<string | null>(null);
export const $selectedMetric = atom<string | null>(null);

// Derived State (Computed)
export const $systemState = computed($systemSnapshot, (snap) => snap?.state || 'STABLE');

export const $isFeverMode = computed($performanceScore, (score) => score >= 90);

// Actions
export function updateScore(score: number) {
  $performanceScore.set(score);
}

export function setNightMode(on: boolean) {
  $isNightMode.set(on);
}

export function setScanning(on: boolean) {
  $isScanning.set(on);
  if (!on) $scanProgress.set(0);
}
