import type { CoreStats } from "./types";

export interface MonsterTemplate {
  id: string;
  name: string;
  color: number;
  /** Lowest floor this monster can appear on. */
  unlockFloor: number;
  /** Multiplier applied to each stat's floor-based growth, giving each monster a distinct archetype. */
  statWeights: CoreStats;
}

// Regular monsters accumulate as you descend — deeper floors mix tougher
// archetypes into the same pool rather than replacing earlier ones.
export const REGULAR_TEMPLATES: MonsterTemplate[] = [
  {
    id: "pit-slime",
    name: "Pit Slime",
    color: 0x6fcf6f,
    unlockFloor: 1,
    statWeights: { str: 1.0, agi: 1.0, vit: 1.0, int: 1.0, dex: 1.0, luk: 1.0 },
  },
  {
    id: "cave-rat",
    name: "Cave Rat",
    color: 0x9b6b3a,
    unlockFloor: 1,
    statWeights: { str: 0.7, agi: 1.5, vit: 0.6, int: 0.5, dex: 1.3, luk: 1.0 },
  },
  {
    id: "mud-wraith",
    name: "Mud Wraith",
    color: 0x7c6a46,
    unlockFloor: 6,
    statWeights: { str: 1.3, agi: 0.5, vit: 1.6, int: 0.6, dex: 0.6, luk: 0.7 },
  },
  {
    id: "rust-beetle",
    name: "Rust Beetle",
    color: 0xb5651d,
    unlockFloor: 6,
    statWeights: { str: 1.1, agi: 0.6, vit: 1.4, int: 0.4, dex: 0.9, luk: 0.6 },
  },
  {
    id: "bone-crawler",
    name: "Bone Crawler",
    color: 0xe0e0e0,
    unlockFloor: 16,
    statWeights: { str: 1.0, agi: 0.9, vit: 0.7, int: 0.5, dex: 1.2, luk: 1.6 },
  },
  {
    id: "fungal-lurker",
    name: "Fungal Lurker",
    color: 0xbb6bd9,
    unlockFloor: 16,
    statWeights: { str: 0.7, agi: 0.8, vit: 0.9, int: 1.6, dex: 1.0, luk: 0.8 },
  },
  {
    id: "hollow-stalker",
    name: "Hollow Stalker",
    color: 0x56ccf2,
    unlockFloor: 26,
    statWeights: { str: 1.0, agi: 1.2, vit: 0.8, int: 0.7, dex: 1.2, luk: 0.9 },
  },
  {
    id: "gloom-bat",
    name: "Gloom Bat",
    color: 0x4a4a68,
    unlockFloor: 26,
    statWeights: { str: 0.6, agi: 1.6, vit: 0.6, int: 0.5, dex: 0.8, luk: 1.1 },
  },
];

// Bosses cycle through this list every BOSS_FLOOR_INTERVAL floors, growing
// stronger each pass because stat scaling is still driven by floor depth.
export const BOSS_TEMPLATES: MonsterTemplate[] = [
  {
    id: "pit-warden",
    name: "Pit Warden",
    color: 0xd33131,
    unlockFloor: 10,
    statWeights: { str: 1.3, agi: 0.8, vit: 1.5, int: 0.6, dex: 1.0, luk: 0.8 },
  },
  {
    id: "the-devourer",
    name: "The Devourer",
    color: 0x8b0000,
    unlockFloor: 10,
    statWeights: { str: 1.7, agi: 0.9, vit: 1.1, int: 0.5, dex: 1.0, luk: 0.9 },
  },
  {
    id: "ashen-colossus",
    name: "Ashen Colossus",
    color: 0x5c5c5c,
    unlockFloor: 10,
    statWeights: { str: 1.2, agi: 0.5, vit: 2.0, int: 0.5, dex: 0.7, luk: 0.5 },
  },
  {
    id: "root-tyrant",
    name: "Root Tyrant",
    color: 0x2e7d32,
    unlockFloor: 10,
    statWeights: { str: 1.2, agi: 0.8, vit: 1.1, int: 0.6, dex: 1.5, luk: 1.4 },
  },
  {
    id: "depth-sovereign",
    name: "Depth Sovereign",
    color: 0x4a148c,
    unlockFloor: 10,
    statWeights: { str: 1.4, agi: 1.3, vit: 1.4, int: 1.2, dex: 1.3, luk: 1.2 },
  },
];
