import { GameState } from "../state/GameState";
import { EQUIPMENT_ITEMS, POTIONS, RARITY_COLORS, type EquipmentItem } from "../data/shopItems";
import type { EquipmentSlot } from "../data/types";

const BUY_QUANTITIES = [1, 5, 10, 20];

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
      <div class="shop-qty-select">
        <label for="potion-qty">Buy amount</label>
        <select id="potion-qty">
          ${BUY_QUANTITIES.map((n) => `<option value="${n}">x${n}</option>`).join("")}
        </select>
      </div>
      <div id="potion-rows"></div>
      <div id="equipment-slots"></div>
    </div>
  `;

  const shopHeader = root.querySelector<HTMLDivElement>("#shop-toggle")!;
  const potionRowsEl = root.querySelector<HTMLDivElement>("#potion-rows")!;
  const equipmentSlotsEl = root.querySelector<HTMLDivElement>("#equipment-slots")!;
  const potionQtySelect = root.querySelector<HTMLSelectElement>("#potion-qty")!;

  // Collapse/expand only has a visible effect on the mobile layout (see
  // media query) — defaults to collapsed so the shop doesn't dominate the
  // small screen before the player scrolls to it.
  root.classList.add("collapsed");
  shopHeader.onclick = () => root.classList.toggle("collapsed");

  let buyQuantity = 1;
  potionQtySelect.onchange = () => {
    buyQuantity = Number(potionQtySelect.value);
    render();
  };

  const potionCountEls = new Map<string, HTMLSpanElement>();
  const potionBuyBtnEls = new Map<string, HTMLButtonElement>();
  const potionUseBtnEls = new Map<string, HTMLButtonElement>();

  for (const potion of POTIONS) {
    const row = document.createElement("div");
    row.className = "shop-item-row";

    const desc = document.createElement("span");
    desc.className = "shop-item-desc";
    const nameTag = document.createElement("span");
    nameTag.style.color = potion.color;
    nameTag.style.fontWeight = "bold";
    nameTag.textContent = potion.name;
    desc.append(nameTag, ` — heals ${potion.healAmount} HP`);

    const countEl = document.createElement("span");
    countEl.className = "shop-potion-count";

    const buyBtn = document.createElement("button");
    buyBtn.onclick = () => gameState.buyPotion(potion, buyQuantity);

    const useBtn = document.createElement("button");
    useBtn.textContent = "Use";
    useBtn.onclick = () => gameState.usePotion(potion);

    const actions = document.createElement("div");
    actions.className = "shop-actions";
    actions.append(countEl, buyBtn, useBtn);

    row.append(desc, actions);
    potionRowsEl.appendChild(row);

    potionCountEls.set(potion.id, countEl);
    potionBuyBtnEls.set(potion.id, buyBtn);
    potionUseBtnEls.set(potion.id, useBtn);
  }

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
    for (const potion of POTIONS) {
      const owned = gameState.potionCount(potion.id);
      const totalCost = potion.cost * buyQuantity;
      potionCountEls.get(potion.id)!.textContent = `x${owned}`;
      potionBuyBtnEls.get(potion.id)!.disabled = gameState.gold < totalCost;
      potionBuyBtnEls.get(potion.id)!.textContent = buyQuantity === 1 ? `Buy ${totalCost}g` : `Buy x${buyQuantity} (${totalCost}g)`;
      potionUseBtnEls.get(potion.id)!.disabled = owned <= 0;
    }

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
