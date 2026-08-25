import type { CoreStats, EquipmentSlot } from "./types";

export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: "#b0b0b0",
  Uncommon: "#4caf50",
  Rare: "#2d9cdb",
  Epic: "#9b51e0",
  Legendary: "#f2994a",
  Mythic: "#ff5fa2",
};

// Aligned with the existing monster/boss unlock floors (1/6/16/26, boss every 10)
// so a rarity tier opens up roughly when the pit's difficulty already matches it.
export const RARITY_UNLOCK_FLOOR: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 5,
  Rare: 15,
  Epic: 25,
  Legendary: 40,
  Mythic: 60,
};

export interface EquipmentItem {
  id: string;
  slot: EquipmentSlot;
  name: string;
  rarity: Rarity;
  cost: number;
  statBonus: Partial<CoreStats>;
}

export interface PotionItem {
  id: string;
  name: string;
  cost: number;
  /** Flat HP restored per use — like RO's potions, this doesn't scale with max HP,
   * so a cheap potion naturally stops mattering once you've leveled past it. */
  healAmount: number;
  color: string;
}

export const POTIONS: PotionItem[] = [
  { id: "red-potion", name: "Red Potion", cost: 12, healAmount: 60, color: "#eb5757" },
  { id: "yellow-potion", name: "Yellow Potion", cost: 50, healAmount: 250, color: "#f2c94c" },
  { id: "white-potion", name: "White Potion", cost: 150, healAmount: 600, color: "#f2f2f2" },
];

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: "rusty-iron-sword", slot: "weapon", name: "Rusty Iron Sword", rarity: "Common", cost: 25, statBonus: { str: 2, dex: 1 } },
  { id: "worn-oak-staff", slot: "weapon", name: "Worn Oak Staff", rarity: "Common", cost: 28, statBonus: { int: 2, luk: 1 } },
  { id: "hunters-shortbow", slot: "weapon", name: "Hunter's Shortbow", rarity: "Common", cost: 32, statBonus: { agi: 2, dex: 2 } },
  { id: "travelers-dagger", slot: "weapon", name: "Traveler's Dagger", rarity: "Common", cost: 30, statBonus: { agi: 1, dex: 2, luk: 1 } },
  { id: "cracked-warhammer", slot: "weapon", name: "Cracked Warhammer", rarity: "Common", cost: 35, statBonus: { str: 3, vit: 1 } },
  { id: "apprentice-wand", slot: "weapon", name: "Apprentice Wand", rarity: "Common", cost: 38, statBonus: { int: 3, luk: 1 } },
  { id: "leather-buckler", slot: "shield", name: "Leather Buckler", rarity: "Common", cost: 22, statBonus: { str: 1, vit: 2 } },
  { id: "wooden-kite-shield", slot: "shield", name: "Wooden Kite Shield", rarity: "Common", cost: 30, statBonus: { str: 1, vit: 3 } },
  { id: "copper-amulet", slot: "accessory", name: "Copper Amulet", rarity: "Common", cost: 40, statBonus: { vit: 1, int: 1, luk: 1 } },
  { id: "lucky-rabbit-charm", slot: "accessory", name: "Lucky Rabbit Charm", rarity: "Common", cost: 45, statBonus: { luk: 3 } },
  { id: "iron-longsword", slot: "weapon", name: "Iron Longsword", rarity: "Uncommon", cost: 75, statBonus: { str: 5, vit: 1, dex: 1 } },
  { id: "steel-hatchet", slot: "weapon", name: "Steel Hatchet", rarity: "Uncommon", cost: 82, statBonus: { str: 4, agi: 1, vit: 1, dex: 1 } },
  { id: "willow-longbow", slot: "weapon", name: "Willow Longbow", rarity: "Uncommon", cost: 88, statBonus: { agi: 4, vit: 1, dex: 2 } },
  { id: "silver-dagger", slot: "weapon", name: "Silver Dagger", rarity: "Uncommon", cost: 95, statBonus: { agi: 2, dex: 4, luk: 1 } },
  { id: "sages-staff", slot: "weapon", name: "Sage's Staff", rarity: "Uncommon", cost: 105, statBonus: { vit: 1, int: 5, luk: 1 } },
  { id: "runed-mace", slot: "weapon", name: "Runed Mace", rarity: "Uncommon", cost: 110, statBonus: { str: 3, vit: 2, int: 1, luk: 1 } },
  { id: "reinforced-tower-shield", slot: "shield", name: "Reinforced Tower Shield", rarity: "Uncommon", cost: 90, statBonus: { str: 2, vit: 5 } },
  { id: "hunters-round-shield", slot: "shield", name: "Hunter's Round Shield", rarity: "Uncommon", cost: 78, statBonus: { str: 1, agi: 2, vit: 3, dex: 1 } },
  { id: "travelers-cloak", slot: "armor", name: "Traveler's Cloak", rarity: "Uncommon", cost: 70, statBonus: { agi: 2, vit: 2, dex: 1, luk: 1 } },
  { id: "scholars-robe", slot: "armor", name: "Scholar's Robe", rarity: "Uncommon", cost: 80, statBonus: { vit: 1, int: 4, luk: 1 } },
  { id: "knights-claymore", slot: "weapon", name: "Knight's Claymore", rarity: "Rare", cost: 220, statBonus: { str: 10, vit: 3, dex: 2 } },
  { id: "windpiercer-bow", slot: "weapon", name: "Windpiercer Bow", rarity: "Rare", cost: 240, statBonus: { agi: 8, vit: 2, dex: 5 } },
  { id: "moonsteel-rapier", slot: "weapon", name: "Moonsteel Rapier", rarity: "Rare", cost: 260, statBonus: { str: 2, agi: 4, vit: 1, dex: 7, luk: 1 } },
  { id: "runeblade", slot: "weapon", name: "Runeblade", rarity: "Rare", cost: 275, statBonus: { str: 4, vit: 2, int: 6, dex: 1, luk: 1 } },
  { id: "stormcaller-staff", slot: "weapon", name: "Stormcaller Staff", rarity: "Rare", cost: 290, statBonus: { agi: 1, vit: 2, int: 10, luk: 2 } },
  { id: "berserker-axe", slot: "weapon", name: "Berserker Axe", rarity: "Rare", cost: 250, statBonus: { str: 12, vit: 2, luk: 1 } },
  { id: "dragonhide-shield", slot: "shield", name: "Dragonhide Shield", rarity: "Rare", cost: 230, statBonus: { str: 3, vit: 8, luk: 1 } },
  { id: "guardian-tower-shield", slot: "shield", name: "Guardian Tower Shield", rarity: "Rare", cost: 245, statBonus: { str: 4, vit: 10 } },
  { id: "shadowweave-hood", slot: "armor", name: "Shadowweave Hood", rarity: "Rare", cost: 210, statBonus: { agi: 5, vit: 2, int: 2, dex: 3, luk: 1 } },
  { id: "mystic-mantle", slot: "armor", name: "Mystic Mantle", rarity: "Rare", cost: 215, statBonus: { agi: 1, vit: 3, int: 8, luk: 2 } },
  { id: "paladin-greatsword", slot: "weapon", name: "Paladin Greatsword", rarity: "Epic", cost: 650, statBonus: { str: 18, vit: 6, int: 2, dex: 2, luk: 1 } },
  { id: "phoenix-bow", slot: "weapon", name: "Phoenix Bow", rarity: "Epic", cost: 690, statBonus: { agi: 15, vit: 4, int: 3, dex: 8, luk: 1 } },
  { id: "voidfang-dagger", slot: "weapon", name: "Voidfang Dagger", rarity: "Epic", cost: 720, statBonus: { str: 2, agi: 8, vit: 2, int: 5, dex: 10, luk: 3 } },
  { id: "archmage-scepter", slot: "weapon", name: "Archmage Scepter", rarity: "Epic", cost: 760, statBonus: { agi: 2, vit: 3, int: 20, dex: 1, luk: 3 } },
  { id: "titans-maul", slot: "weapon", name: "Titan's Maul", rarity: "Epic", cost: 700, statBonus: { str: 22, vit: 10, luk: 1 } },
  { id: "celestial-spear", slot: "weapon", name: "Celestial Spear", rarity: "Epic", cost: 735, statBonus: { str: 10, agi: 8, vit: 5, int: 4, dex: 5, luk: 2 } },
  { id: "aegis-of-dawn", slot: "shield", name: "Aegis of Dawn", rarity: "Epic", cost: 620, statBonus: { str: 6, vit: 18, int: 4, luk: 2 } },
  { id: "obsidian-bulwark", slot: "shield", name: "Obsidian Bulwark", rarity: "Epic", cost: 680, statBonus: { str: 8, vit: 22, luk: 1 } },
  { id: "crown-of-insight", slot: "armor", name: "Crown of Insight", rarity: "Epic", cost: 600, statBonus: { str: 1, agi: 2, vit: 4, int: 16, dex: 2, luk: 3 } },
  { id: "dragonrider-armor", slot: "armor", name: "Dragonrider Armor", rarity: "Epic", cost: 640, statBonus: { str: 10, agi: 5, vit: 14, dex: 3, luk: 2 } },
  { id: "demon-kings-blade", slot: "weapon", name: "Demon King's Blade", rarity: "Legendary", cost: 1800, statBonus: { str: 38, agi: 4, vit: 10, int: 4, dex: 5, luk: 3 } },
  { id: "heavenfall-greatbow", slot: "weapon", name: "Heavenfall Greatbow", rarity: "Legendary", cost: 1900, statBonus: { str: 2, agi: 32, vit: 8, int: 5, dex: 16, luk: 4 } },
  { id: "eternal-nightblade", slot: "weapon", name: "Eternal Nightblade", rarity: "Legendary", cost: 2100, statBonus: { str: 6, agi: 18, vit: 4, int: 10, dex: 24, luk: 8 } },
  { id: "astral-archstaff", slot: "weapon", name: "Astral Archstaff", rarity: "Legendary", cost: 2200, statBonus: { str: 2, agi: 5, vit: 8, int: 42, dex: 3, luk: 7 } },
  { id: "worldbreaker-hammer", slot: "weapon", name: "Worldbreaker Hammer", rarity: "Legendary", cost: 2000, statBonus: { str: 48, vit: 18, int: 2, luk: 2 } },
  { id: "sovereigns-spear", slot: "weapon", name: "Sovereign's Spear", rarity: "Legendary", cost: 1950, statBonus: { str: 28, agi: 14, vit: 12, int: 6, dex: 10, luk: 4 } },
  { id: "phoenixguard-shield", slot: "shield", name: "Phoenixguard Shield", rarity: "Legendary", cost: 1750, statBonus: { str: 12, agi: 3, vit: 36, int: 8, dex: 1, luk: 4 } },
  { id: "titanforged-aegis", slot: "shield", name: "Titanforged Aegis", rarity: "Legendary", cost: 1850, statBonus: { str: 18, vit: 42, int: 3, luk: 2 } },
  { id: "crown-of-the-immortal", slot: "armor", name: "Crown of the Immortal", rarity: "Legendary", cost: 1700, statBonus: { str: 6, agi: 5, vit: 16, int: 28, dex: 6, luk: 8 } },
  { id: "armor-of-the-first-king", slot: "armor", name: "Armor of the First King", rarity: "Legendary", cost: 1900, statBonus: { str: 24, agi: 5, vit: 32, int: 5, dex: 4, luk: 5 } },
  { id: "blade-of-the-ancients", slot: "weapon", name: "Blade of the Ancients", rarity: "Mythic", cost: 5000, statBonus: { str: 65, agi: 8, vit: 18, int: 8, dex: 10, luk: 6 } },
  { id: "starfall-longbow", slot: "weapon", name: "Starfall Longbow", rarity: "Mythic", cost: 5200, statBonus: { str: 4, agi: 58, vit: 14, int: 10, dex: 30, luk: 8 } },
  { id: "fang-of-the-void-serpent", slot: "weapon", name: "Fang of the Void Serpent", rarity: "Mythic", cost: 5600, statBonus: { str: 10, agi: 34, vit: 8, int: 18, dex: 42, luk: 14 } },
  { id: "cosmic-arcanum", slot: "weapon", name: "Cosmic Arcanum", rarity: "Mythic", cost: 6000, statBonus: { str: 5, agi: 10, vit: 14, int: 75, dex: 8, luk: 12 } },
  { id: "mountains-wrath", slot: "weapon", name: "Mountain's Wrath", rarity: "Mythic", cost: 5400, statBonus: { str: 82, vit: 30, int: 4, luk: 4 } },
  { id: "spear-of-eternity", slot: "weapon", name: "Spear of Eternity", rarity: "Mythic", cost: 5500, statBonus: { str: 48, agi: 28, vit: 20, int: 12, dex: 18, luk: 8 } },
  { id: "bulwark-of-creation", slot: "shield", name: "Bulwark of Creation", rarity: "Mythic", cost: 4800, statBonus: { str: 24, agi: 5, vit: 68, int: 14, dex: 2, luk: 8 } },
  { id: "worldshield", slot: "shield", name: "Worldshield", rarity: "Mythic", cost: 5100, statBonus: { str: 30, vit: 78, int: 8, luk: 4 } },
  { id: "mantle-of-the-cosmos", slot: "armor", name: "Mantle of the Cosmos", rarity: "Mythic", cost: 4700, statBonus: { str: 8, agi: 14, vit: 28, int: 58, dex: 12, luk: 16 } },
  { id: "immortal-dragonplate", slot: "armor", name: "Immortal Dragonplate", rarity: "Mythic", cost: 5000, statBonus: { str: 42, agi: 8, vit: 62, int: 10, dex: 8, luk: 10 } },
  { id: "ironhelm", slot: "helmet", name: "Ironhelm", rarity: "Common", cost: 20, statBonus: { str: 1, vit: 1 } },
  { id: "leather-cap", slot: "helmet", name: "Leather Cap", rarity: "Common", cost: 18, statBonus: { agi: 1, vit: 1, dex: 1 } },
  { id: "woolen-hood", slot: "helmet", name: "Woolen Hood", rarity: "Common", cost: 20, statBonus: { vit: 1, int: 1, luk: 1 } },
  { id: "iron-greaves", slot: "armor", name: "Iron Greaves", rarity: "Common", cost: 26, statBonus: { str: 2, vit: 2 } },
  { id: "leather-boots", slot: "armor", name: "Leather Boots", rarity: "Common", cost: 24, statBonus: { agi: 2, vit: 1, dex: 1 } },
  { id: "apprentice-gloves", slot: "armor", name: "Apprentice Gloves", rarity: "Common", cost: 22, statBonus: { agi: 1, int: 1, dex: 1 } },
  { id: "steel-helm", slot: "helmet", name: "Steel Helm", rarity: "Uncommon", cost: 65, statBonus: { str: 3, vit: 3, dex: 1 } },
  { id: "ranger-hood", slot: "helmet", name: "Ranger Hood", rarity: "Uncommon", cost: 62, statBonus: { agi: 4, vit: 2, dex: 2 } },
  { id: "mystic-circlet", slot: "helmet", name: "Mystic Circlet", rarity: "Uncommon", cost: 72, statBonus: { vit: 1, int: 4, luk: 1 } },
  { id: "steel-greaves", slot: "armor", name: "Steel Greaves", rarity: "Uncommon", cost: 68, statBonus: { str: 4, vit: 4 } },
  { id: "ranger-boots", slot: "armor", name: "Ranger Boots", rarity: "Uncommon", cost: 70, statBonus: { agi: 4, vit: 2, dex: 3 } },
  { id: "spellwoven-gloves", slot: "armor", name: "Spellwoven Gloves", rarity: "Uncommon", cost: 74, statBonus: { agi: 2, int: 4, dex: 1 } },
  { id: "knight-helm", slot: "helmet", name: "Knight Helm", rarity: "Rare", cost: 180, statBonus: { str: 6, vit: 6, dex: 1 } },
  { id: "falconers-hood", slot: "helmet", name: "Falconer's Hood", rarity: "Rare", cost: 170, statBonus: { agi: 7, vit: 3, dex: 4, luk: 1 } },
  { id: "sage-crown", slot: "helmet", name: "Sage Crown", rarity: "Rare", cost: 190, statBonus: { str: 1, vit: 2, int: 8, luk: 2 } },
  { id: "knight-greaves", slot: "armor", name: "Knight Greaves", rarity: "Rare", cost: 185, statBonus: { str: 7, vit: 7 } },
  { id: "swiftstep-boots", slot: "armor", name: "Swiftstep Boots", rarity: "Rare", cost: 175, statBonus: { agi: 7, vit: 3, dex: 5, luk: 1 } },
  { id: "runic-gauntlets", slot: "armor", name: "Runic Gauntlets", rarity: "Rare", cost: 200, statBonus: { str: 3, agi: 1, vit: 2, int: 6, dex: 2, luk: 1 } },
  { id: "dragonbone-helm", slot: "helmet", name: "Dragonbone Helm", rarity: "Epic", cost: 520, statBonus: { str: 10, agi: 2, vit: 12, int: 1, dex: 2, luk: 1 } },
  { id: "storm-hood", slot: "helmet", name: "Storm Hood", rarity: "Epic", cost: 500, statBonus: { str: 1, agi: 8, vit: 4, int: 8, dex: 4, luk: 2 } },
  { id: "archmage-crown", slot: "helmet", name: "Archmage Crown", rarity: "Epic", cost: 560, statBonus: { str: 1, agi: 2, vit: 4, int: 15, dex: 1, luk: 3 } },
  { id: "dragonbone-greaves", slot: "armor", name: "Dragonbone Greaves", rarity: "Epic", cost: 540, statBonus: { str: 12, agi: 1, vit: 12, int: 1, luk: 1 } },
  { id: "windrunner-boots", slot: "armor", name: "Windrunner Boots", rarity: "Epic", cost: 525, statBonus: { agi: 12, vit: 5, int: 2, dex: 8, luk: 2 } },
  { id: "titan-gauntlets", slot: "armor", name: "Titan Gauntlets", rarity: "Epic", cost: 570, statBonus: { str: 15, agi: 1, vit: 8, int: 1, dex: 1, luk: 1 } },
  { id: "crown-of-kings", slot: "helmet", name: "Crown of Kings", rarity: "Legendary", cost: 1500, statBonus: { str: 18, agi: 4, vit: 18, int: 5, dex: 4, luk: 3 } },
  { id: "helm-of-the-stormlord", slot: "helmet", name: "Helm of the Stormlord", rarity: "Legendary", cost: 1550, statBonus: { str: 5, agi: 15, vit: 8, int: 12, dex: 7, luk: 4 } },
  { id: "oracles-diadem", slot: "helmet", name: "Oracle's Diadem", rarity: "Legendary", cost: 1650, statBonus: { str: 2, agi: 6, vit: 6, int: 30, dex: 4, luk: 7 } },
  { id: "greaves-of-the-colossus", slot: "armor", name: "Greaves of the Colossus", rarity: "Legendary", cost: 1450, statBonus: { str: 22, agi: 2, vit: 22, int: 3, dex: 1, luk: 2 } },
  { id: "boots-of-the-wind-king", slot: "armor", name: "Boots of the Wind King", rarity: "Legendary", cost: 1480, statBonus: { str: 1, agi: 20, vit: 8, int: 4, dex: 14, luk: 4 } },
  { id: "gauntlets-of-ruin", slot: "armor", name: "Gauntlets of Ruin", rarity: "Legendary", cost: 1600, statBonus: { str: 25, agi: 2, vit: 14, int: 2, dex: 2, luk: 2 } },
  { id: "halo-of-the-first-star", slot: "helmet", name: "Halo of the First Star", rarity: "Mythic", cost: 4200, statBonus: { str: 8, agi: 10, vit: 12, int: 48, dex: 8, luk: 12 } },
  { id: "crown-of-infinity", slot: "helmet", name: "Crown of Infinity", rarity: "Mythic", cost: 4500, statBonus: { str: 6, agi: 12, vit: 16, int: 58, dex: 10, luk: 15 } },
  { id: "helm-of-the-world-titan", slot: "helmet", name: "Helm of the World Titan", rarity: "Mythic", cost: 4100, statBonus: { str: 30, agi: 4, vit: 42, int: 6, dex: 2, luk: 3 } },
  { id: "greaves-of-eternity", slot: "armor", name: "Greaves of Eternity", rarity: "Mythic", cost: 4000, statBonus: { str: 34, agi: 3, vit: 36, int: 5, dex: 1, luk: 3 } },
  { id: "boots-beyond-time", slot: "armor", name: "Boots Beyond Time", rarity: "Mythic", cost: 4300, statBonus: { str: 3, agi: 34, vit: 14, int: 8, dex: 26, luk: 8 } },
  { id: "hands-of-the-creator", slot: "armor", name: "Hands of the Creator", rarity: "Mythic", cost: 4400, statBonus: { str: 38, agi: 4, vit: 22, int: 5, dex: 5, luk: 5 } },
  { id: "band-of-iron-will", slot: "accessory", name: "Band of Iron Will", rarity: "Uncommon", cost: 85, statBonus: { str: 2, vit: 3, luk: 1 } },
  { id: "jade-fortune-ring", slot: "accessory", name: "Jade Fortune Ring", rarity: "Rare", cost: 195, statBonus: { agi: 1, vit: 1, int: 2, dex: 1, luk: 6 } },
  { id: "ring-of-the-phoenix", slot: "accessory", name: "Ring of the Phoenix", rarity: "Epic", cost: 620, statBonus: { str: 3, agi: 3, vit: 5, int: 7, dex: 2, luk: 5 } },
  { id: "eternal-luckstone", slot: "accessory", name: "Eternal Luckstone", rarity: "Mythic", cost: 4600, statBonus: { str: 4, agi: 8, vit: 10, int: 18, dex: 8, luk: 35 } },
];
