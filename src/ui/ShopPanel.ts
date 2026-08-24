import { GameState } from "../state/GameState";
import { EQUIPMENT_ITEMS, POTION, type EquipmentItem } from "../data/shopItems";
import type { EquipmentSlot } from "../data/types";

const SLOTS: EquipmentSlot[] = ["weapon", "armor", "accessory"];
const SLOT_LABELS: Record<EquipmentSlot, string> = { weapon: "Weapon", armor: "Armor", accessory: "Accessory" };

function formatBonus(bonus: EquipmentItem["statBonus"]): string {
  return Object.entries(bonus)
    .map(([key, value]) => `+${value} ${key.toUpperCase()}`)
    .join(" ");
}

export function mountShopPanel(root: HTMLElement, gameState: GameState) {
  root.innerHTML = `
    <h2>Shop</h2>
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
  `;

  const potionCountEl = root.querySelector<HTMLSpanElement>("#potion-count")!;
  const buyPotionBtn = root.querySelector<HTMLButtonElement>("#buy-potion")!;
  const usePotionBtn = root.querySelector<HTMLButtonElement>("#use-potion")!;
  const equipmentSlotsEl = root.querySelector<HTMLDivElement>("#equipment-slots")!;

  buyPotionBtn.onclick = () => gameState.buyPotion();
  usePotionBtn.onclick = () => gameState.usePotion();

  const equippedLabelEls = new Map<EquipmentSlot, HTMLSpanElement>();
  const itemButtonEls = new Map<string, HTMLButtonElement>();

  for (const slot of SLOTS) {
    const section = document.createElement("div");
    section.className = "shop-slot";

    const header = document.createElement("div");
    header.className = "shop-slot-header";
    const slotLabel = document.createElement("span");
    slotLabel.textContent = SLOT_LABELS[slot];
    const equippedLabel = document.createElement("span");
    equippedLabel.className = "shop-equipped";
    header.append(slotLabel, equippedLabel);
    section.appendChild(header);
    equippedLabelEls.set(slot, equippedLabel);

    for (const item of EQUIPMENT_ITEMS.filter((i) => i.slot === slot)) {
      const row = document.createElement("div");
      row.className = "shop-item-row";

      const desc = document.createElement("span");
      desc.textContent = `${item.name} (${formatBonus(item.statBonus)})`;

      const btn = document.createElement("button");
      btn.onclick = () => gameState.buyEquipment(item);

      row.append(desc, btn);
      section.appendChild(row);
      itemButtonEls.set(item.id, btn);
    }

    equipmentSlotsEl.appendChild(section);
  }

  function render() {
    potionCountEl.textContent = `Owned: ${gameState.potions}`;
    buyPotionBtn.disabled = gameState.gold < POTION.cost;
    usePotionBtn.disabled = gameState.potions <= 0;

    for (const slot of SLOTS) {
      const equippedId = gameState.equipment[slot];
      const equippedItem = EQUIPMENT_ITEMS.find((i) => i.id === equippedId);
      const currentTier = equippedItem?.tier ?? 0;
      equippedLabelEls.get(slot)!.textContent = equippedItem ? `Equipped: ${equippedItem.name}` : "Equipped: None";

      for (const item of EQUIPMENT_ITEMS.filter((i) => i.slot === slot)) {
        const btn = itemButtonEls.get(item.id)!;
        const isEquipped = item.id === equippedId;
        const isOwnedOrWorse = item.tier <= currentTier;
        btn.disabled = isOwnedOrWorse || gameState.gold < item.cost;
        btn.textContent = isEquipped ? "Equipped" : isOwnedOrWorse ? "Owned better" : `${item.cost}g`;
      }
    }
  }

  gameState.onChange(render);
  render();
}
