import type { CoreStats, MonsterDefinition } from "../data/types";
import type { MonsterTemplate } from "../data/monsterTemplates";
import { deriveStats } from "../data/stats";
import { BOSS_TEMPLATES, REGULAR_TEMPLATES } from "../data/monsterTemplates";

export const BOSS_FLOOR_INTERVAL = 10;

export function isBossFloor(floor: number): boolean {
  return floor % BOSS_FLOOR_INTERVAL === 0;
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRegularTemplate(floor: number): MonsterTemplate {
  const unlocked = REGULAR_TEMPLATES.filter((t) => t.unlockFloor <= floor);
  return pick(unlocked.length > 0 ? unlocked : REGULAR_TEMPLATES);
}

function pickBossTemplate(floor: number): MonsterTemplate {
  const bossIndex = Math.floor(floor / BOSS_FLOOR_INTERVAL) - 1;
  return BOSS_TEMPLATES[bossIndex % BOSS_TEMPLATES.length];
}

function scaledStats(floor: number, boss: boolean, weights: CoreStats): CoreStats {
  const growth = 1 + floor * 0.35;
  const variance = () => randRange(0.85, 1.15);
  const boost = boss ? 2.2 : 1;
  const base = 4;
  const key = (k: keyof CoreStats) => Math.floor((base + growth * weights[k]) * variance() * boost);
  return { str: key("str"), agi: key("agi"), vit: key("vit"), int: key("int"), dex: key("dex"), luk: key("luk") };
}

export function generateFloorMonster(floor: number): MonsterDefinition {
  const boss = isBossFloor(floor);
  const template = boss ? pickBossTemplate(floor) : pickRegularTemplate(floor);
  const level = boss ? floor + 2 : floor;
  const stats = scaledStats(floor, boss, template.statWeights);
  const derived = deriveStats(level, stats);
  const hp = boss ? Math.floor(derived.maxHp * 1.8) : derived.maxHp;

  return {
    id: template.id,
    name: template.name,
    color: template.color,
    isBoss: boss,
    level,
    stats,
    hp,
    expReward: Math.floor((boss ? 8 : 1.5) * (10 + floor * 4)),
    goldReward: Math.floor((boss ? 6 : 1) * (5 + floor * 2)),
  };
}
