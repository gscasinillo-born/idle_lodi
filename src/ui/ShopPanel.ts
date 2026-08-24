import { GameState } from "../state/GameState";
import { EQUIPMENT_ITEMS, POTION, RARITY_COLORS, type EquipmentItem } from "../data/shopItems";
import type { EquipmentSlot } from "../data/types";

const SLOTS: EquipmentSlot[] = ["weapon", "shield", "armor", "helmet", "accessory"];
const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: "Weapon",
  shield: "Shield",
  armor: "Armor",
  helmet: "Helmet",
  accessory: "Accessory",
};

function formatBonus(bonus: EquipmentItem["statBonus"]): string {
  return Object.entries(bonus)
    .map(([key, value]) => `+${value} ${key.toUpperCase()}`)
    .join(" ");
}

export function mountShopPanel(root: HTMLElement, gameState: GameState) {
  root.innerHTML = `
    <div class="shop-header" id="shop-toggle">
      <h2>Shop</h2>
      <span class="shop-toggle-icon">▸</span>
    </div>
    <div class="shop-content">
      <div class="shop-item-row">
        <span>${POTION.name} — heals ${Math.round(POTION.healPercent * 100)}% HP</span>
      </div>
      <div class="shop-item-row">
        <span id="potion-count"></span>
        <div class="shop-actions">
          <button id="buy-potion">Buy ${POTION.cost}g</button>
          <button id="use-potion">Use</button>
        </div>
      </div>
      <div id="equipment-slots"></div>
    </div>
  `;

  const shopHeader = root.querySelector<HTMLDivElement>("#shop-toggle")!;
  const potionCountEl = root.querySelector<HTMLSpanElement>("#potion-count")!;
  const buyPotionBtn = root.querySelector<HTMLButtonElement>("#buy-potion")!;
  const usePotionBtn = root.querySelector<HTMLButtonElement>("#use-potion")!;
  const equipmentSlotsEl = root.querySelector<HTMLDivElement>("#equipment-slots")!;

  buyPotionBtn.onclick = () => gameState.buyPotion();
  usePotionBtn.onclick = () => gameState.usePotion();

  // Collapse/expand only has a visible effect on the mobile layout (see
  // media query) — defaults to collapsed so the shop doesn't dominate the
  // small screen before the player scrolls to it.
  root.classList.add("collapsed");
  shopHeader.onclick = () => root.classList.toggle("collapsed");

  const slotLabelEls = new Map<EquipmentSlot, HTMLSpanElement>();
  const equippedLabelEls = new Map<EquipmentSlot, HTMLSpanElement>();
  const itemButtonEls = new Map<string, HTMLButtonElement>();
  const itemRowEls = new Map<string, HTMLDivElement>();

  for (const slot of SLOTS) {
    const items = EQUIPMENT_ITEMS.filter((i) => i.slot === slot).sort((a, b) => a.cost - b.cost);

    const section = document.createElement("div");
    section.className = "shop-slot collapsed";

    const header = document.createElement("div");
    header.className = "shop-slot-header";
    const slotLabel = document.createElement("span");
    slotLabelEls.set(slot, slotLabel);
    const equippedLabel = document.createElement("span");
    equippedLabel.className = "shop-equipped";
    const toggleIcon = document.createElement("span");
    toggleIcon.className = "shop-slot-toggle-icon";
    toggleIcon.textContent = "▸";
    header.append(slotLabel, equippedLabel, toggleIcon);
    header.onclick = () => section.classList.toggle("collapsed");
    section.appendChild(header);
    equippedLabelEls.set(slot, equippedLabel);

    const itemsEl = document.createElement("div");
    itemsEl.className = "shop-slot-items";

    for (const item of items) {
      const row = document.createElement("div");
      row.className = "shop-item-row";

      const desc = document.createElement("span");
      desc.className = "shop-item-desc";
      const rarityTag = document.createElement("span");
      rarityTag.className = "shop-rarity";
      rarityTag.style.color = RARITY_COLORS[item.rarity];
      rarityTag.textContent = item.rarity;
      desc.append(`${item.name} `, rarityTag, ` (${formatBonus(item.statBonus)})`);

      const btn = document.createElement("button");
      btn.onclick = () => gameState.buyEquipment(item);

      row.append(desc, btn);
      itemsEl.appendChild(row);
      itemButtonEls.set(item.id, btn);
      itemRowEls.set(item.id, row);
    }

    section.appendChild(itemsEl);
    equipmentSlotsEl.appendChild(section);
  }

  function render() {
    potionCountEl.textContent = `Owned: ${gameState.potions}`;
    buyPotionBtn.disabled = gameState.gold < POTION.cost;
    usePotionBtn.disabled = gameState.potions <= 0;

    for (const slot of SLOTS) {
      const equippedId = gameState.equipment[slot];
      const equippedItem = EQUIPMENT_ITEMS.find((i) => i.id === equippedId);
      equippedLabelEls.get(slot)!.textContent = equippedItem ? `Equipped: ${equippedItem.name}` : "Equipped: None";

      const slotItems = EQUIPMENT_ITEMS.filter((i) => i.slot === slot);
      let unlockedCount = 0;

      for (const item of slotItems) {
        const unlocked = gameState.isRarityUnlocked(item.rarity);
        if (unlocked) unlockedCount += 1;
        itemRowEls.get(item.id)!.style.display = unlocked ? "" : "none";

        const btn = itemButtonEls.get(item.id)!;
        const isEquipped = item.id === equippedId;
        btn.disabled = isEquipped || gameState.gold < item.cost;
        btn.textContent = isEquipped ? "Equipped" : `${item.cost}g`;
      }

      const label = SLOT_LABELS[slot];
      slotLabelEls.get(slot)!.textContent =
        unlockedCount < slotItems.length ? `${label} (${unlockedCount}/${slotItems.length})` : `${label} (${slotItems.length})`;
    }
  }

  gameState.onChange(render);
  render();
}
