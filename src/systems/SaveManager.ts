import type { SaveData } from "../data/types";
import { createBaseStats, expToNextLevel } from "../data/stats";

const STORAGE_KEY = "idle-lodi-save-v1";
const SAVE_VERSION = 1;

export function createNewSave(): SaveData {
  return {
    version: SAVE_VERSION,
    floor: 1,
    level: 1,
    exp: 0,
    expToNext: expToNextLevel(1),
    gold: 0,
    statPoints: 0,
    stats: createBaseStats(),
    hp: 1,
    log: [],
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
