import type { CoreStats, EquipmentSlot } from "./types";

export interface EquipmentItem {
  id: string;
  slot: EquipmentSlot;
  name: string;
  cost: number;
  /** Ordering within a slot — a higher tier replaces a lower one. */
  tier: number;
  statBonus: Partial<CoreStats>;
}

export interface PotionItem {
  id: string;
  name: string;
  cost: number;
  /** Fraction of max HP restored per use. */
  healPercent: number;
}

export const POTION: PotionItem = {
  id: "minor-potion",
  name: "Minor Potion",
  cost: 15,
  healPercent: 0.5,
};

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: "rusty-sword", slot: "weapon", name: "Rusty Sword", cost: 30, tier: 1, statBonus: { str: 3 } },
  { id: "iron-sword", slot: "weapon", name: "Iron Sword", cost: 100, tier: 2, statBonus: { str: 8 } },
  { id: "steel-sword", slot: "weapon", name: "Steel Sword", cost: 250, tier: 3, statBonus: { str: 15 } },

  { id: "leather-armor", slot: "armor", name: "Leather Armor", cost: 30, tier: 1, statBonus: { vit: 3 } },
  { id: "chainmail", slot: "armor", name: "Chainmail", cost: 100, tier: 2, statBonus: { vit: 8 } },
  { id: "plate-armor", slot: "armor", name: "Plate Armor", cost: 250, tier: 3, statBonus: { vit: 15 } },

  { id: "copper-ring", slot: "accessory", name: "Copper Ring", cost: 40, tier: 1, statBonus: { dex: 2, luk: 2 } },
  { id: "silver-ring", slot: "accessory", name: "Silver Ring", cost: 120, tier: 2, statBonus: { dex: 5, luk: 5 } },
  { id: "gold-ring", slot: "accessory", name: "Gold Ring", cost: 280, tier: 3, statBonus: { dex: 10, luk: 10 } },
];
