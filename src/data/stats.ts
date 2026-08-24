import type { CoreStats, DerivedStats } from "./types";

export const BASE_STAT_VALUE = 5;
export const STAT_POINTS_PER_LEVEL = 3;

export function createBaseStats(): CoreStats {
  return { str: BASE_STAT_VALUE, agi: BASE_STAT_VALUE, vit: BASE_STAT_VALUE, int: BASE_STAT_VALUE, dex: BASE_STAT_VALUE, luk: BASE_STAT_VALUE };
}

// Ragnarok-flavored derived stat formulas, simplified for an auto-battler.
export function deriveStats(level: number, stats: CoreStats): DerivedStats {
  const maxHp = Math.floor(40 + level * 12 + stats.vit * 8);
  const atk = Math.floor(2 + stats.str * 1.5 + level * 0.5);
  const matk = Math.floor(2 + stats.int * 1.5 + level * 0.5);
  const hit = Math.floor(80 + stats.dex * 1.2 + level);
  const flee = Math.floor(80 + stats.agi * 1.2 + level * 0.5);
  const crit = Math.min(60, stats.luk * 0.3);
  // Higher AGI attacks faster, floor of 400ms so fights stay readable.
  const attackIntervalMs = Math.max(400, 1600 - stats.agi * 10);
  return { maxHp, atk, matk, hit, flee, crit, attackIntervalMs };
}

export function expToNextLevel(level: number): number {
  return Math.floor(20 * Math.pow(level, 1.5));
}
