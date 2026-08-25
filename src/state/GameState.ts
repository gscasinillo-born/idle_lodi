import type { CoreStats, DerivedStats, EquipmentState, SaveData, StatKey } from "../data/types";
import { deriveStats, expToNextLevel, STAT_POINTS_PER_LEVEL } from "../data/stats";
import { createNewSave, loadSave, writeSave } from "../systems/SaveManager";
import { EQUIPMENT_ITEMS, POTIONS, RARITY_UNLOCK_FLOOR, type EquipmentItem, type PotionItem } from "../data/shopItems";

const MAX_LOG_LINES = 40;
const SAVE_INTERVAL_MS = 5000;
// Auto-drink a potion once HP dips to this fraction of max, so the player doesn't
// have to babysit the health bar during auto-battling.
const AUTO_POTION_HP_THRESHOLD = 0.5;

type Listener = () => void;
// "down" = descending deeper into the pit (floor number increases), "up" = climbing back
// toward the surface (floor number decreases) — lets GameScene play the matching walk
// animation instead of just teleporting to the next floor's encounter.
type FloorJumpListener = (direction: "up" | "down") => void;

export class GameState {
  private data: SaveData;
  private listeners: Listener[] = [];
  // Separate from onChange: only fires for manual floor navigation, so GameScene can
  // respawn the encounter immediately without disturbing the paced delay used after combat.
  private floorJumpListeners: FloorJumpListener[] = [];
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
  potionCount(potionId: string): number { return this.data.potions[potionId] ?? 0; }
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

  onFloorJump(listener: FloorJumpListener): () => void {
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
    if (this.data.hp > 0) this.autoUsePotionIfNeeded();
    this.notify();
    return this.data.hp <= 0;
  }

  /** Auto-drinks a potion when HP is low and one is in stock — picks the smallest
   * one that covers the deficit so a big potion isn't wasted on a small dip, falling
   * back to the strongest potion on hand if nothing available is big enough. */
  private autoUsePotionIfNeeded() {
    const maxHp = this.derived.maxHp;
    if (this.data.hp / maxHp > AUTO_POTION_HP_THRESHOLD) return;
    const available = POTIONS.filter((p) => this.potionCount(p.id) > 0);
    if (available.length === 0) return;
    const deficit = maxHp - this.data.hp;
    const sufficient = available.filter((p) => p.healAmount >= deficit).sort((a, b) => a.healAmount - b.healAmount);
    const potion = sufficient[0] ?? [...available].sort((a, b) => b.healAmount - a.healAmount)[0];
    this.usePotion(potion, true);
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

  /** Manually step to a higher floor number — only within floors already cleared before.
   * Clamped to whatever's actually available, so a "+20" past the edge just goes as far as it can. */
  goUpFloor(steps = 1): boolean {
    const target = Math.min(this.data.maxFloorReached, this.data.floor + steps);
    if (target <= this.data.floor) return false;
    this.data.floor = target;
    this.addLog(`Moved up to floor ${this.data.floor}.`);
    this.floorJumpListeners.forEach((l) => l("down"));
    return true;
  }

  /** Manually step to a lower floor number — always allowed since it's already been passed through. */
  goDownFloor(steps = 1): boolean {
    const target = Math.max(1, this.data.floor - steps);
    if (target >= this.data.floor) return false;
    this.data.floor = target;
    this.addLog(`Moved down to floor ${this.data.floor}.`);
    this.floorJumpListeners.forEach((l) => l("up"));
    return true;
  }

  buyPotion(potion: PotionItem, quantity = 1): boolean {
    const totalCost = potion.cost * quantity;
    if (this.data.gold < totalCost) return false;
    this.data.gold -= totalCost;
    this.data.potions[potion.id] = (this.data.potions[potion.id] ?? 0) + quantity;
    this.addLog(quantity === 1 ? `Bought a ${potion.name}.` : `Bought ${quantity}x ${potion.name}.`);
    return true;
  }

  usePotion(potion: PotionItem, auto = false): boolean {
    if (this.potionCount(potion.id) <= 0) return false;
    this.data.potions[potion.id] -= 1;
    const maxHp = this.derived.maxHp;
    const healed = Math.min(potion.healAmount, maxHp - this.data.hp);
    this.data.hp = Math.min(maxHp, this.data.hp + potion.healAmount);
    const prefix = auto ? "Auto-used" : "Used";
    this.addLog(`${prefix} a ${potion.name}, restoring ${Math.floor(healed)} HP.`);
    return true;
  }

  isRarityUnlocked(rarity: EquipmentItem["rarity"]): boolean {
    return this.data.maxFloorReached >= RARITY_UNLOCK_FLOOR[rarity];
  }

  buyEquipment(item: EquipmentItem): boolean {
    if (!this.isRarityUnlocked(item.rarity)) return false;
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
