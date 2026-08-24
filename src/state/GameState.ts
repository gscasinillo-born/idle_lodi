import type { CoreStats, DerivedStats, EquipmentState, SaveData, StatKey } from "../data/types";
import { deriveStats, expToNextLevel, STAT_POINTS_PER_LEVEL } from "../data/stats";
import { createNewSave, loadSave, writeSave } from "../systems/SaveManager";
import { EQUIPMENT_ITEMS, POTION, type EquipmentItem } from "../data/shopItems";

const MAX_LOG_LINES = 40;
const SAVE_INTERVAL_MS = 5000;

type Listener = () => void;

export class GameState {
  private data: SaveData;
  private listeners: Listener[] = [];
  // Separate from onChange: only fires for manual floor navigation, so GameScene can
  // respawn the encounter immediately without disturbing the paced delay used after combat.
  private floorJumpListeners: Listener[] = [];
  private saveTimer = 0;

  constructor() {
    this.data = loadSave();
    if (this.data.hp <= 0) this.data.hp = this.derived.maxHp;
    if (this.data.maxFloorReached < this.data.floor) this.data.maxFloorReached = this.data.floor;
  }

  get floor() { return this.data.floor; }
  get maxFloorReached() { return this.data.maxFloorReached; }
  get level() { return this.data.level; }
  get exp() { return this.data.exp; }
  get expToNext() { return this.data.expToNext; }
  get gold() { return this.data.gold; }
  get statPoints() { return this.data.statPoints; }
  get stats(): CoreStats { return this.data.stats; }
  get hp() { return this.data.hp; }
  get log() { return this.data.log; }
  get potions() { return this.data.potions; }
  get equipment(): EquipmentState { return this.data.equipment; }

  /** Base stats plus whatever's currently equipped — this is what combat actually uses. */
  get effectiveStats(): CoreStats {
    const stats = { ...this.data.stats };
    for (const itemId of Object.values(this.data.equipment)) {
      const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
      if (!item) continue;
      for (const [key, bonus] of Object.entries(item.statBonus) as [StatKey, number][]) {
        stats[key] += bonus;
      }
    }
    return stats;
  }

  get derived(): DerivedStats {
    return deriveStats(this.data.level, this.effectiveStats);
  }

  onChange(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  onFloorJump(listener: Listener): () => void {
    this.floorJumpListeners.push(listener);
    return () => { this.floorJumpListeners = this.floorJumpListeners.filter((l) => l !== listener); };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  addLog(message: string) {
    this.data.log = [message, ...this.data.log].slice(0, MAX_LOG_LINES);
    this.notify();
  }

  allocateStat(key: StatKey) {
    if (this.data.statPoints <= 0) return;
    this.data.stats[key] += 1;
    this.data.statPoints -= 1;
    // Allocating VIT can raise maxHp; keep current HP proportionally rather than free-healing.
    this.notify();
  }

  takeDamage(amount: number): boolean {
    this.data.hp = Math.max(0, this.data.hp - amount);
    this.notify();
    return this.data.hp <= 0;
  }

  regen(deltaSeconds: number) {
    if (this.data.hp <= 0) return;
    const maxHp = this.derived.maxHp;
    if (this.data.hp >= maxHp) return;
    this.data.hp = Math.min(maxHp, this.data.hp + maxHp * 0.02 * deltaSeconds);
    this.notify();
  }

  fullHeal() {
    this.data.hp = this.derived.maxHp;
    this.notify();
  }

  gainRewards(exp: number, gold: number): { leveledUp: boolean } {
    this.data.exp += exp;
    this.data.gold += gold;
    let leveledUp = false;
    while (this.data.exp >= this.data.expToNext) {
      this.data.exp -= this.data.expToNext;
      this.data.level += 1;
      this.data.statPoints += STAT_POINTS_PER_LEVEL;
      this.data.expToNext = expToNextLevel(this.data.level);
      leveledUp = true;
    }
    this.notify();
    return { leveledUp };
  }

  advanceFloor() {
    this.data.floor += 1;
    if (this.data.floor > this.data.maxFloorReached) this.data.maxFloorReached = this.data.floor;
    this.notify();
  }

  retreatFloor() {
    this.data.floor = Math.max(1, this.data.floor - 1);
    this.notify();
  }

  /** Manually step to a higher floor number — only within floors already cleared before. */
  goUpFloor(): boolean {
    if (this.data.floor >= this.data.maxFloorReached) return false;
    this.data.floor += 1;
    this.addLog(`Moved up to floor ${this.data.floor}.`);
    this.floorJumpListeners.forEach((l) => l());
    return true;
  }

  /** Manually step to a lower floor number — always allowed since it's already been passed through. */
  goDownFloor(): boolean {
    if (this.data.floor <= 1) return false;
    this.data.floor -= 1;
    this.addLog(`Moved down to floor ${this.data.floor}.`);
    this.floorJumpListeners.forEach((l) => l());
    return true;
  }

  buyPotion(): boolean {
    if (this.data.gold < POTION.cost) return false;
    this.data.gold -= POTION.cost;
    this.data.potions += 1;
    this.addLog(`Bought a ${POTION.name}.`);
    return true;
  }

  usePotion(): boolean {
    if (this.data.potions <= 0) return false;
    this.data.potions -= 1;
    const healed = Math.floor(this.derived.maxHp * POTION.healPercent);
    this.data.hp = Math.min(this.derived.maxHp, this.data.hp + healed);
    this.addLog(`Used a ${POTION.name}, restoring ${healed} HP.`);
    return true;
  }

  buyEquipment(item: EquipmentItem): boolean {
    if (this.data.gold < item.cost) return false;
    this.data.gold -= item.cost;
    this.data.equipment[item.slot] = item.id;
    this.addLog(`Equipped ${item.name}.`);
    return true;
  }

  tickAutoSave(deltaMs: number) {
    this.saveTimer += deltaMs;
    if (this.saveTimer >= SAVE_INTERVAL_MS) {
      this.saveTimer = 0;
      this.persist();
    }
  }

  persist() {
    writeSave(this.data);
  }

  resetProgress() {
    this.data = createNewSave();
    this.data.hp = this.derived.maxHp;
    this.persist();
    this.notify();
  }
}
