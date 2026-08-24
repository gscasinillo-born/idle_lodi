export interface CoreStats {
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
}

export type StatKey = keyof CoreStats;

export interface DerivedStats {
  maxHp: number;
  atk: number;
  matk: number;
  hit: number;
  flee: number;
  crit: number;
  attackIntervalMs: number;
}

export interface CombatantSnapshot {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  derived: DerivedStats;
  color: number;
  radius: number;
}

export interface MonsterDefinition {
  id: string;
  name: string;
  color: number;
  isBoss: boolean;
  level: number;
  stats: CoreStats;
  hp: number;
  expReward: number;
  goldReward: number;
}

export interface SaveData {
  version: number;
  floor: number;
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
  statPoints: number;
  stats: CoreStats;
  hp: number;
  log: string[];
}
