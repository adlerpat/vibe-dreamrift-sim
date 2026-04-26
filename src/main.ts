import "./styles.css";
import { Game } from "./game/Game";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found.");
}

app.innerHTML = `
  <main class="app-shell">
    <section class="prepull-overlay">
      <div class="prepull-panel">
        <p class="panel-label">Encounter Setup</p>
        <h2 class="prepull-title">Choose Your Role</h2>
        <p class="prepull-copy">
          Lock in your assignment for the Kimärus pull, then start a 5 second countdown.
        </p>

        <div class="prepull-role-picker" aria-label="Choose a role">
          <button class="prepull-role-button is-selected" data-role="damage" type="button">
            Damage
          </button>
          <button class="prepull-role-button" data-role="tank" type="button">Tank</button>
          <button class="prepull-role-button" data-role="healer" type="button">Healer</button>
          <button class="prepull-role-button" data-role="raidleader" type="button">
            Raidleader
          </button>
        </div>

        <button class="pulltimer-button" type="button">Start Pulltimer</button>

        <div class="pulltimer-overlay" aria-hidden="true">
          <div class="pulltimer-ring">
            <span class="pulltimer-count">5</span>
          </div>
          <p class="pulltimer-label">Pull in</p>
        </div>
      </div>

      <div class="defeat-overlay" aria-hidden="true">
        <div class="defeat-panel">
          <p class="panel-label">Attempt Ended</p>
          <h2 class="defeat-title">Defeated</h2>
          <p class="defeat-copy">
            Try <span class="defeat-attempt-count">1</span> ended at
            <span class="defeat-progress">0%</span> boss health remaining.
          </p>
          <div class="defeat-actions">
            <button class="chainpull-button" type="button">Chainpull</button>
            <button class="reselect-button" type="button">Reselect Role</button>
          </div>
        </div>
      </div>

      <div class="victory-overlay" aria-hidden="true">
        <div class="victory-panel">
          <p class="panel-label">Encounter Cleared</p>
          <h2 class="victory-title">Victory</h2>
          <p class="victory-copy">
            Try <span class="victory-attempt-count">1</span> defeated Kimärus with
            <span class="victory-role-label">Damage</span>.
          </p>
          <div class="victory-actions">
            <button class="victory-chainpull-button" type="button">Chainpull</button>
            <button class="victory-reselect-button" type="button">Reselect Role</button>
          </div>
        </div>
      </div>
    </section>

    <section class="game-layout">
      <header class="top-bar">
        <div>
          <h1>Dreamrift Simulator</h1>
        </div>
        <div class="top-bar-meta">
          <span class="status-pill">Step 4: Combat prototype</span>
          <span class="status-pill status-pill-muted">Action bar online</span>
        </div>
      </header>

      <section class="playfield-panel">
        <aside class="encounter-panel encounter-panel-left">
          <div class="panel-card" data-card>
            <div class="panel-card-head">
              <p class="panel-label">Raid Frames</p>
              <button class="panel-close-button" data-card-toggle type="button" aria-label="Collapse raid frames panel">
                -
              </button>
            </div>
            <div class="panel-card-body">
              <div class="raid-frames"></div>
            </div>
          </div>
        </aside>

        <section class="arena-column">
          <div class="boss-header">
            <div class="boss-header-bar">
              <div class="boss-header-fill" style="width: 100%">
                <div class="boss-header-content">
                  <span class="boss-title">Kimärus</span>
                  <span class="boss-header-value">1200 / 1200</span>
                </div>
              </div>
            </div>
            <p class="boss-cast-text">No active cast</p>
          </div>

          <div class="canvas-frame">
            <canvas class="game-canvas" aria-label="Dreamrift encounter room"></canvas>
          </div>
        </section>

        <aside class="encounter-panel">
          <div class="panel-card" data-card>
            <div class="panel-card-head">
              <p class="panel-label">Active Unit</p>
              <button class="panel-close-button" data-card-toggle type="button" aria-label="Collapse active unit panel">
                -
              </button>
            </div>
            <div class="panel-card-body">
              <h2 class="active-unit-name">Ariyn</h2>
              <p class="active-unit-role">Damage Dealer</p>
              <p class="active-unit-hint">Use WASD to reposition around the arena.</p>
            </div>
          </div>

          <div class="panel-card" data-card>
            <div class="panel-card-head">
              <p class="panel-label">Combat Feed</p>
              <button class="panel-close-button" data-card-toggle type="button" aria-label="Collapse combat feed panel">
                -
              </button>
            </div>
            <div class="panel-card-body">
              <div class="combat-log"></div>
            </div>
          </div>
        </aside>
      </section>

      <section class="action-bar-shell">
        <div class="action-bar"></div>
        <div class="ability-tooltip" aria-hidden="true"></div>
      </section>
    </section>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>(".game-canvas");
const prepullOverlay = document.querySelector<HTMLElement>(".prepull-overlay");
const prepullRoleButtons = document.querySelectorAll<HTMLButtonElement>(".prepull-role-button");
const pulltimerButton = document.querySelector<HTMLButtonElement>(".pulltimer-button");
const pulltimerOverlay = document.querySelector<HTMLElement>(".pulltimer-overlay");
const pulltimerCount = document.querySelector<HTMLElement>(".pulltimer-count");
const defeatOverlay = document.querySelector<HTMLElement>(".defeat-overlay");
const defeatAttemptCount = document.querySelector<HTMLElement>(".defeat-attempt-count");
const defeatProgress = document.querySelector<HTMLElement>(".defeat-progress");
const chainpullButton = document.querySelector<HTMLButtonElement>(".chainpull-button");
const reselectButton = document.querySelector<HTMLButtonElement>(".reselect-button");
const victoryOverlay = document.querySelector<HTMLElement>(".victory-overlay");
const victoryAttemptCount = document.querySelector<HTMLElement>(".victory-attempt-count");
const victoryRoleLabel = document.querySelector<HTMLElement>(".victory-role-label");
const victoryChainpullButton = document.querySelector<HTMLButtonElement>(".victory-chainpull-button");
const victoryReselectButton = document.querySelector<HTMLButtonElement>(".victory-reselect-button");
const activeUnitName = document.querySelector<HTMLElement>(".active-unit-name");
const activeUnitRole = document.querySelector<HTMLElement>(".active-unit-role");
const activeUnitHint = document.querySelector<HTMLElement>(".active-unit-hint");
const bossHeaderTitle = document.querySelector<HTMLElement>(".boss-title");
const bossHeaderValue = document.querySelector<HTMLElement>(".boss-header-value");
const bossHeaderFill = document.querySelector<HTMLElement>(".boss-header-fill");
const bossCastText = document.querySelector<HTMLElement>(".boss-cast-text");
const actionBar = document.querySelector<HTMLElement>(".action-bar");
const abilityTooltip = document.querySelector<HTMLElement>(".ability-tooltip");
const combatLog = document.querySelector<HTMLElement>(".combat-log");
const raidFrames = document.querySelector<HTMLElement>(".raid-frames");
const cardToggleButtons = document.querySelectorAll<HTMLButtonElement>("[data-card-toggle]");

if (
  !canvas ||
  !prepullOverlay ||
  !pulltimerButton ||
  !pulltimerOverlay ||
  !pulltimerCount ||
  !defeatOverlay ||
  !defeatAttemptCount ||
  !defeatProgress ||
  !chainpullButton ||
  !reselectButton ||
  !victoryOverlay ||
  !victoryAttemptCount ||
  !victoryRoleLabel ||
  !victoryChainpullButton ||
  !victoryReselectButton ||
  !activeUnitName ||
  !activeUnitRole ||
  !activeUnitHint ||
  !bossHeaderTitle ||
  !bossHeaderValue ||
  !bossHeaderFill ||
  !bossCastText ||
  !actionBar ||
  !abilityTooltip ||
  !combatLog ||
  !raidFrames
) {
  throw new Error("Game UI root elements were not found.");
}

let selectedRole = "damage";
let pulltimerIntervalId: number | null = null;
let attemptCount = 0;
let hasEncounterStarted = false;
let defeatShownForAttempt = false;
let victoryShownForAttempt = false;
let currentMode = selectedRole;
let currentSelectedUnitId = "damage-1";
const raidFrameNodes = new Map<
  string,
  {
    button: HTMLButtonElement;
    article: HTMLElement;
    name: HTMLElement;
    percent: HTMLElement;
    fill: HTMLElement;
  }
>();

const game = new Game(canvas, {
  onSelectionChange: ({ selectedRole, unitId, unitName, roleLabel, hintText }) => {
    currentMode = selectedRole;
    currentSelectedUnitId = unitId;
    activeUnitName.textContent = unitName;
    activeUnitRole.textContent = roleLabel;
    activeUnitHint.textContent = hintText;
  },
  onHudChange: ({
    abilities,
    bossCastLabel,
    bossCastRemaining,
    encounterFinished,
    bossHp,
    bossMaxHp,
    bossName,
    logEntries,
    raidFrames: raidFrameEntries,
  }) => {
    bossHeaderTitle.textContent = bossName;
    bossHeaderValue.textContent = `${bossHp} / ${bossMaxHp}`;
    bossHeaderFill.style.width = `${(bossHp / bossMaxHp) * 100}%`;
    bossCastText.textContent = bossCastLabel
      ? `${bossCastLabel} • ${bossCastRemaining.toFixed(1)}s`
      : "No active cast";

    if (encounterFinished && bossHp > 0 && hasEncounterStarted && !defeatShownForAttempt) {
      defeatShownForAttempt = true;
      defeatAttemptCount.textContent = String(attemptCount);
      defeatProgress.textContent = `${Math.round((bossHp / bossMaxHp) * 100)}%`;
      prepullOverlay.classList.remove("is-hidden");
      prepullOverlay.classList.add("is-defeat");
      prepullOverlay.classList.remove("is-countdown");
      defeatOverlay.classList.add("is-visible");
      defeatOverlay.setAttribute("aria-hidden", "false");
      victoryOverlay.classList.remove("is-visible");
      victoryOverlay.setAttribute("aria-hidden", "true");
      pulltimerOverlay.setAttribute("aria-hidden", "true");
    }

    if (encounterFinished && bossHp <= 0 && hasEncounterStarted && !victoryShownForAttempt) {
      victoryShownForAttempt = true;
      victoryAttemptCount.textContent = String(attemptCount);
      victoryRoleLabel.textContent = formatRoleLabel(selectedRole);
      prepullOverlay.classList.remove("is-hidden");
      prepullOverlay.classList.add("is-defeat");
      prepullOverlay.classList.remove("is-countdown");
      victoryOverlay.classList.add("is-visible");
      victoryOverlay.setAttribute("aria-hidden", "false");
      defeatOverlay.classList.remove("is-visible");
      defeatOverlay.setAttribute("aria-hidden", "true");
      pulltimerOverlay.setAttribute("aria-hidden", "true");
    }

    actionBar.innerHTML = abilities
      .map(
        (ability) => `
          <button
            class="ability-card ${ability.ready ? "is-ready" : "is-cooling"}"
            data-ability="${ability.id}"
            data-ability-name="${ability.name}"
            data-ability-description="${ability.description}"
            data-ability-status="${ability.ready ? "Ready" : `${ability.cooldownRemaining.toFixed(1)}s cooldown`}"
            data-ability-cooldown="${ability.cooldownDuration > 0 ? `${ability.cooldownDuration.toFixed(1)}s cooldown` : "Instant"}"
            type="button"
          >
            <span class="ability-topline">
              <span class="ability-slot">${ability.slotLabel}</span>
              <span class="ability-name">${ability.name}</span>
              <span class="ability-state">${ability.ready ? "Ready" : `${ability.cooldownRemaining.toFixed(1)}s`}</span>
            </span>
          </button>
        `,
      )
      .join("");

    syncRaidFrames(raidFrameEntries);

    combatLog.innerHTML = logEntries
      .map(
        (entry) => `
          <p class="combat-log-entry combat-log-entry-${entry.emphasis ?? "utility"}">${entry.text}</p>
        `,
      )
      .join("");
  },
});

game.setMode(selectedRole);

for (const button of prepullRoleButtons) {
  button.addEventListener("click", () => {
    const role = button.dataset.role;

    if (!role) {
      return;
    }

    selectedRole = role;
    currentMode = role;
    game.setMode(role);

    for (const roleButton of prepullRoleButtons) {
      roleButton.classList.toggle("is-selected", roleButton.dataset.role === role);
    }
  });
}

pulltimerButton.addEventListener("click", () => {
  startPulltimer();
});

raidFrames.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const frame = target.closest<HTMLButtonElement>(".raid-frame-button");

  if (!frame) {
    return;
  }

  const unitId = frame.dataset.unitId;

  if (!unitId) {
    return;
  }

  if (!game.selectRaidUnit(unitId)) {
    return;
  }

  currentSelectedUnitId = unitId;
});

chainpullButton.addEventListener("click", () => {
  startPulltimer();
});

victoryChainpullButton.addEventListener("click", () => {
  startPulltimer();
});

reselectButton.addEventListener("click", () => {
  resetToRoleSelect();
});

victoryReselectButton.addEventListener("click", () => {
  resetToRoleSelect();
});

function resetToRoleSelect(): void {
  const ensuredPrepullOverlay = prepullOverlay!;
  const ensuredDefeatOverlay = defeatOverlay!;
  const ensuredVictoryOverlay = victoryOverlay!;
  const ensuredPulltimerOverlay = pulltimerOverlay!;
  const ensuredPulltimerButton = pulltimerButton!;

  if (pulltimerIntervalId !== null) {
    window.clearInterval(pulltimerIntervalId);
    pulltimerIntervalId = null;
  }

  game.stop();
  game.resetEncounter(selectedRole);
  hasEncounterStarted = false;
  defeatShownForAttempt = false;
  victoryShownForAttempt = false;
  ensuredPrepullOverlay.classList.remove("is-hidden", "is-countdown", "is-defeat");
  ensuredDefeatOverlay.classList.remove("is-visible");
  ensuredDefeatOverlay.setAttribute("aria-hidden", "true");
  ensuredVictoryOverlay.classList.remove("is-visible");
  ensuredVictoryOverlay.setAttribute("aria-hidden", "true");
  ensuredPulltimerOverlay.setAttribute("aria-hidden", "true");
  ensuredPulltimerButton.disabled = false;
}

actionBar.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>(".ability-card");

  if (!button) {
    return;
  }

  const abilityId = button.dataset.ability;

  if (abilityId === "melee") {
    game.triggerAbility("melee");
  }

  if (abilityId === "ranged") {
    game.triggerAbility("ranged");
  }

  if (abilityId === "role") {
    game.triggerAbility("role");
  }
});

actionBar.addEventListener("mouseover", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>(".ability-card");

  if (!button) {
    return;
  }

  const name = button.dataset.abilityName;
  const description = button.dataset.abilityDescription;
  const status = button.dataset.abilityStatus;
  const cooldown = button.dataset.abilityCooldown;

  if (!name || !description || !status || !cooldown) {
    return;
  }

  const shellRect = actionBar.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const tooltipLeft = buttonRect.left - shellRect.left + buttonRect.width / 2;

  abilityTooltip.innerHTML = `
    <p class="ability-tooltip-name">${name}</p>
    <p class="ability-tooltip-description">${description}</p>
    <p class="ability-tooltip-status">${status}</p>
    <p class="ability-tooltip-cooldown">Cooldown: ${cooldown}</p>
  `;
  abilityTooltip.style.left = `${tooltipLeft}px`;
  abilityTooltip.classList.add("is-visible");
});

actionBar.addEventListener("mouseout", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const fromButton = target.closest<HTMLButtonElement>(".ability-card");
  const relatedTarget = event.relatedTarget;

  if (!(fromButton && relatedTarget instanceof Node && fromButton.contains(relatedTarget))) {
    abilityTooltip.classList.remove("is-visible");
  }
});

for (const button of cardToggleButtons) {
  button.addEventListener("click", () => {
    const card = button.closest<HTMLElement>("[data-card]");

    if (!card) {
      return;
    }

    const isCollapsed = card.classList.toggle("is-collapsed");
    button.textContent = isCollapsed ? "+" : "-";
  });
}

function startPulltimer(): void {
  if (pulltimerIntervalId !== null) {
    return;
  }

  const ensuredPulltimerCount = pulltimerCount!;
  const ensuredDefeatOverlay = defeatOverlay!;
  const ensuredVictoryOverlay = victoryOverlay!;
  const ensuredPrepullOverlay = prepullOverlay!;
  const ensuredPulltimerOverlay = pulltimerOverlay!;
  const ensuredPulltimerButton = pulltimerButton!;

  let remainingSeconds = 5;
  attemptCount += 1;
  defeatShownForAttempt = false;
  victoryShownForAttempt = false;
  ensuredPulltimerCount.textContent = String(remainingSeconds);
  ensuredDefeatOverlay.classList.remove("is-visible");
  ensuredDefeatOverlay.setAttribute("aria-hidden", "true");
  ensuredVictoryOverlay.classList.remove("is-visible");
  ensuredVictoryOverlay.setAttribute("aria-hidden", "true");
  ensuredPrepullOverlay.classList.remove("is-hidden");
  ensuredPrepullOverlay.classList.remove("is-defeat");
  ensuredPrepullOverlay.classList.add("is-countdown");
  ensuredPulltimerOverlay.setAttribute("aria-hidden", "false");
  ensuredPulltimerButton.disabled = true;
  game.resetEncounter(selectedRole);

  pulltimerIntervalId = window.setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      if (pulltimerIntervalId !== null) {
        window.clearInterval(pulltimerIntervalId);
        pulltimerIntervalId = null;
      }

      ensuredPrepullOverlay.classList.add("is-hidden");
      hasEncounterStarted = true;
      game.start();
      return;
    }

    ensuredPulltimerCount.textContent = String(remainingSeconds);
  }, 1000);
}

function formatRoleLabel(role: string): string {
  if (role === "raidleader") {
    return "Raidleader";
  }

  if (role === "damage") {
    return "Damage";
  }

  if (role === "tank") {
    return "Tank";
  }

  return "Healer";
}

function syncRaidFrames(
  raidFrameEntries: Array<{
    id: string;
    name: string;
    roleLabel: string;
    hp: number;
    maxHp: number;
    healthPercent: number;
    color: string;
  }>,
): void {
  const ensuredRaidFrames = raidFrames!;
  const seenIds = new Set<string>();

  for (const frame of raidFrameEntries) {
    seenIds.add(frame.id);

    let nodes = raidFrameNodes.get(frame.id);

    if (!nodes) {
      const button = document.createElement("button");
      button.className = "raid-frame-button";
      button.dataset.unitId = frame.id;
      button.type = "button";

      const article = document.createElement("article");
      article.className = "raid-frame";

      const head = document.createElement("div");
      head.className = "raid-frame-head";

      const name = document.createElement("span");
      name.className = "raid-frame-name";

      const percent = document.createElement("span");
      percent.className = "raid-frame-percent";

      const bar = document.createElement("div");
      bar.className = "raid-frame-bar";

      const fill = document.createElement("div");
      fill.className = "raid-frame-fill";

      head.append(name, percent);
      bar.append(fill);
      article.append(head, bar);
      button.append(article);
      ensuredRaidFrames.append(button);

      nodes = { button, article, name, percent, fill };
      raidFrameNodes.set(frame.id, nodes);
    }

    nodes.article.className = `raid-frame raid-frame-${frame.roleLabel.toLowerCase().replace(" ", "-")} ${
      currentMode === "raidleader" && currentSelectedUnitId === frame.id ? "is-selected" : ""
    }`;
    nodes.name.textContent = frame.name;
    nodes.percent.textContent = `${Math.round(frame.healthPercent)}%`;
    nodes.fill.style.width = `${frame.healthPercent}%`;
    nodes.fill.style.background = `linear-gradient(90deg, ${frame.color}, rgba(255,255,255,0.12))`;
  }

  for (const [unitId, nodes] of raidFrameNodes.entries()) {
    if (seenIds.has(unitId)) {
      continue;
    }

    nodes.button.remove();
    raidFrameNodes.delete(unitId);
  }
}
