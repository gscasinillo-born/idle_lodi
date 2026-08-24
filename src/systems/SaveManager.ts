import type { SaveData } from "../data/types";
import { createBaseStats, expToNextLevel } from "../data/stats";

const STORAGE_KEY = "idle-lodi-save-v1";
// Bumped for the shield/helmet equipment slots — older saves reset cleanly rather than load with missing fields.
const SAVE_VERSION = 4;

export function createNewSave(): SaveData {
  return {
    version: SAVE_VERSION,
    floor: 1,
    maxFloorReached: 1,
    level: 1,
    exp: 0,
    expToNext: expToNextLevel(1),
    gold: 0,
    statPoints: 0,
    stats: createBaseStats(),
    hp: 1,
    log: [],
    potions: 0,
    equipment: { weapon: null, shield: null, armor: null, helmet: null, accessory: null },
  };
}

export function loadSave(): SaveData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createNewSave();
  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== SAVE_VERSION) return createNewSave();
    return parsed;
  } catch {
    return createNewSave();
  }
}

export function writeSave(data: SaveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}
