import { GameState } from "../state/GameState";
import type { StatKey } from "../data/types";

const FLOOR_STEPS = [1, 5, 10, 20];

const STAT_LABELS: { key: StatKey; label: string; description: string }[] = [
  { key: "str", label: "STR", description: "Raises your attack power — deal more damage per hit." },
  { key: "agi", label: "AGI", description: "Raises attack speed and your chance to dodge enemy attacks." },
  { key: "vit", label: "VIT", description: "Raises your max HP — survive more hits before going down." },
  { key: "int", label: "INT", description: "Raises magic power. Not used in combat yet — saved for a future update." },
  { key: "dex", label: "DEX", description: "Raises accuracy — your attacks are less likely to miss." },
  { key: "luk", label: "LUK", description: "Raises your chance to land a critical hit for bonus damage." },
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
      <div class="floor-step-select">
        <label for="floor-step">Move by</label>
        <select id="floor-step">
          ${FLOOR_STEPS.map((n) => `<option value="${n}">${n}</option>`).join("")}
        </select>
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
  const floorStepSelect = root.querySelector<HTMLSelectElement>("#floor-step")!;

  let floorStep = 1;
  floorStepSelect.onchange = () => {
    floorStep = Number(floorStepSelect.value);
    render();
  };

  floorDownBtn.onclick = () => gameState.goDownFloor(floorStep);
  floorUpBtn.onclick = () => gameState.goUpFloor(floorStep);

  // Built once and updated in place — rebuilding these nodes on every state
  // change (e.g. the per-frame regen tick) can drop a click that lands
  // mid-teardown, since the element under the cursor gets swapped out
  // between mousedown and mouseup.
  const statValueEls = new Map<StatKey, HTMLSpanElement>();
  const statBonusEls = new Map<StatKey, HTMLSpanElement>();
  const statButtonEls = new Map<StatKey, HTMLButtonElement>();

  for (const { key, label, description } of STAT_LABELS) {
    const block = document.createElement("div");
    block.className = "stat-block";

    const row = document.createElement("div");
    row.className = "stat-row";

    const labelEl = document.createElement("span");
    labelEl.className = "stat-label";
    labelEl.textContent = label;

    const infoBtn = document.createElement("button");
    infoBtn.className = "stat-info-btn";
    infoBtn.textContent = "ⓘ";
    infoBtn.setAttribute("aria-label", `What does ${label} do?`);

    const valueEl = document.createElement("span");
    valueEl.className = "stat-value";

    const bonusEl = document.createElement("span");
    bonusEl.className = "stat-bonus";

    const btn = document.createElement("button");
    btn.textContent = "+";
    btn.onclick = () => gameState.allocateStat(key);

    row.append(labelEl, infoBtn, valueEl, bonusEl, btn);

    const descEl = document.createElement("div");
    descEl.className = "stat-desc";
    descEl.textContent = description;

    infoBtn.onclick = () => descEl.classList.toggle("visible");

    block.append(row, descEl);
    statRowsEl.appendChild(block);

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
