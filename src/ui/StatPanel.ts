import { GameState } from "../state/GameState";
import type { StatKey } from "../data/types";

const STAT_LABELS: { key: StatKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "agi", label: "AGI" },
  { key: "vit", label: "VIT" },
  { key: "int", label: "INT" },
  { key: "dex", label: "DEX" },
  { key: "luk", label: "LUK" },
];

export function mountStatPanel(root: HTMLElement, gameState: GameState) {
  root.innerHTML = `
    <div class="panel-section">
      <h1>Idle Lodi</h1>
      <div id="char-summary"></div>
      <div class="floor-nav">
        <button id="floor-down">Down</button>
        <span id="floor-label"></span>
        <button id="floor-up">Up</button>
      </div>
    </div>
    <div class="panel-section">
      <h2>Stats <span id="stat-points"></span></h2>
      <div id="stat-rows"></div>
    </div>
    <div class="panel-section log-section">
      <h2>Log</h2>
      <div id="log-lines"></div>
    </div>
  `;

  const summaryEl = root.querySelector<HTMLDivElement>("#char-summary")!;
  const statPointsEl = root.querySelector<HTMLSpanElement>("#stat-points")!;
  const statRowsEl = root.querySelector<HTMLDivElement>("#stat-rows")!;
  const logEl = root.querySelector<HTMLDivElement>("#log-lines")!;
  const floorLabelEl = root.querySelector<HTMLSpanElement>("#floor-label")!;
  const floorDownBtn = root.querySelector<HTMLButtonElement>("#floor-down")!;
  const floorUpBtn = root.querySelector<HTMLButtonElement>("#floor-up")!;

  floorDownBtn.onclick = () => gameState.goDownFloor();
  floorUpBtn.onclick = () => gameState.goUpFloor();

  // Built once and updated in place — rebuilding these nodes on every state
  // change (e.g. the per-frame regen tick) can drop a click that lands
  // mid-teardown, since the element under the cursor gets swapped out
  // between mousedown and mouseup.
  const statValueEls = new Map<StatKey, HTMLSpanElement>();
  const statBonusEls = new Map<StatKey, HTMLSpanElement>();
  const statButtonEls = new Map<StatKey, HTMLButtonElement>();

  for (const { key, label } of STAT_LABELS) {
    const row = document.createElement("div");
    row.className = "stat-row";

    const labelEl = document.createElement("span");
    labelEl.className = "stat-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "stat-value";

    const bonusEl = document.createElement("span");
    bonusEl.className = "stat-bonus";

    const btn = document.createElement("button");
    btn.textContent = "+";
    btn.onclick = () => gameState.allocateStat(key);

    row.append(labelEl, valueEl, bonusEl, btn);
    statRowsEl.appendChild(row);

    statValueEls.set(key, valueEl);
    statBonusEls.set(key, bonusEl);
    statButtonEls.set(key, btn);
  }

  function render() {
    const derived = gameState.derived;
    summaryEl.innerHTML = `
      <div>Level ${gameState.level}</div>
      <div class="bar"><div class="bar-fill exp" style="width:${Math.min(100, (gameState.exp / gameState.expToNext) * 100)}%"></div></div>
      <div class="small">${Math.floor(gameState.exp)} / ${gameState.expToNext} EXP</div>
      <div>HP: ${Math.ceil(gameState.hp)} / ${derived.maxHp}</div>
      <div>Gold: ${gameState.gold}</div>
    `;

    floorLabelEl.textContent = `Floor: ${gameState.floor} / ${gameState.maxFloorReached}`;
    floorDownBtn.disabled = gameState.floor <= 1;
    floorUpBtn.disabled = gameState.floor >= gameState.maxFloorReached;

    statPointsEl.textContent = gameState.statPoints > 0 ? `(${gameState.statPoints} points)` : "";

    const effectiveStats = gameState.effectiveStats;
    for (const { key } of STAT_LABELS) {
      const base = gameState.stats[key];
      const bonus = effectiveStats[key] - base;
      statValueEls.get(key)!.textContent = String(base);
      statBonusEls.get(key)!.textContent = bonus > 0 ? `(+${bonus})` : "";
      statButtonEls.get(key)!.disabled = gameState.statPoints <= 0;
    }

    logEl.innerHTML = gameState.log.map((line) => `<div class="log-line">${line}</div>`).join("");
  }

  gameState.onChange(render);
  render();
}
