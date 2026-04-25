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
          </div>

          <div class="canvas-frame">
            <canvas class="game-canvas" aria-label="Dreamrift encounter room"></canvas>
          </div>
        </section>

        <aside class="encounter-panel">
          <div class="panel-card" data-card>
            <div class="panel-card-head">
              <p class="panel-label">Encounter</p>
              <button class="panel-close-button" data-card-toggle type="button" aria-label="Collapse encounter panel">
                -
              </button>
            </div>
            <div class="panel-card-body">
              <h2>Dreamrift, Seed of Midnight</h2>
              <p>
                Pick a role and move your assigned raider with WASD or the arrow keys. Use
                1, 2, and 3 for melee, ranged, and your role action.
              </p>
            </div>
          </div>

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
              <p class="panel-label">Vitals</p>
              <button class="panel-close-button" data-card-toggle type="button" aria-label="Collapse vitals panel">
                -
              </button>
            </div>
            <div class="panel-card-body">
              <div class="vitals-grid">
                <div class="vital-block">
                  <div class="vital-row">
                    <span class="vital-name active-unit-vital-name">Ariyn</span>
                    <span class="vital-value active-unit-vital-value">110 / 110</span>
                  </div>
                  <div class="vital-bar">
                    <div class="vital-bar-fill active-unit-vital-fill" style="width: 100%"></div>
                  </div>
                </div>

                <div class="vital-block">
                  <div class="vital-row">
                    <span class="vital-name boss-vital-name">Kimärus</span>
                    <span class="vital-value boss-vital-value">1200 / 1200</span>
                  </div>
                  <div class="vital-bar boss-vital-bar">
                    <div class="vital-bar-fill boss-vital-fill" style="width: 100%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-card" data-card>
            <div class="panel-card-head">
              <p class="panel-label">Prototype Focus</p>
              <button class="panel-close-button" data-card-toggle type="button" aria-label="Collapse prototype focus panel">
                -
              </button>
            </div>
            <div class="panel-card-body">
              <ul class="panel-list">
                <li>Six raid members and one boss marker</li>
                <li>Basic attacks and role abilities on cooldowns</li>
                <li>Raidleader swap between all allies with Tab</li>
                <li>Health bars and encounter feedback loop</li>
              </ul>
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
const activeUnitName = document.querySelector<HTMLElement>(".active-unit-name");
const activeUnitRole = document.querySelector<HTMLElement>(".active-unit-role");
const activeUnitHint = document.querySelector<HTMLElement>(".active-unit-hint");
const activeUnitVitalName = document.querySelector<HTMLElement>(".active-unit-vital-name");
const activeUnitVitalValue = document.querySelector<HTMLElement>(".active-unit-vital-value");
const activeUnitVitalFill = document.querySelector<HTMLElement>(".active-unit-vital-fill");
const bossVitalName = document.querySelector<HTMLElement>(".boss-vital-name");
const bossVitalValue = document.querySelector<HTMLElement>(".boss-vital-value");
const bossVitalFill = document.querySelector<HTMLElement>(".boss-vital-fill");
const bossHeaderTitle = document.querySelector<HTMLElement>(".boss-title");
const bossHeaderValue = document.querySelector<HTMLElement>(".boss-header-value");
const bossHeaderFill = document.querySelector<HTMLElement>(".boss-header-fill");
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
  !activeUnitName ||
  !activeUnitRole ||
  !activeUnitHint ||
  !activeUnitVitalName ||
  !activeUnitVitalValue ||
  !activeUnitVitalFill ||
  !bossVitalName ||
  !bossVitalValue ||
  !bossVitalFill ||
  !bossHeaderTitle ||
  !bossHeaderValue ||
  !bossHeaderFill ||
  !actionBar ||
  !abilityTooltip ||
  !combatLog ||
  !raidFrames
) {
  throw new Error("Game UI root elements were not found.");
}

let selectedRole = "damage";
let pulltimerIntervalId: number | null = null;

const game = new Game(canvas, {
  onSelectionChange: ({ unitName, roleLabel, hintText }) => {
    activeUnitName.textContent = unitName;
    activeUnitRole.textContent = roleLabel;
    activeUnitHint.textContent = hintText;
  },
  onHudChange: ({
    abilities,
    bossHp,
    bossMaxHp,
    bossName,
    logEntries,
    raidFrames: raidFrameEntries,
    roleLabel,
    unitHp,
    unitMaxHp,
    unitName,
  }) => {
    activeUnitVitalName.textContent = `${unitName} (${roleLabel})`;
    activeUnitVitalValue.textContent = `${unitHp} / ${unitMaxHp}`;
    activeUnitVitalFill.style.width = `${(unitHp / unitMaxHp) * 100}%`;

    bossVitalName.textContent = bossName;
    bossVitalValue.textContent = `${bossHp} / ${bossMaxHp}`;
    bossVitalFill.style.width = `${(bossHp / bossMaxHp) * 100}%`;
    bossHeaderTitle.textContent = bossName;
    bossHeaderValue.textContent = `${bossHp} / ${bossMaxHp}`;
    bossHeaderFill.style.width = `${(bossHp / bossMaxHp) * 100}%`;

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

    raidFrames.innerHTML = raidFrameEntries
      .map(
        (frame) => `
          <article class="raid-frame raid-frame-${frame.roleLabel.toLowerCase().replace(" ", "-")}">
            <div class="raid-frame-head">
              <span class="raid-frame-name">${frame.name}</span>
              <span class="raid-frame-percent">${Math.round(frame.healthPercent)}%</span>
            </div>
            <div class="raid-frame-bar">
              <div
                class="raid-frame-fill"
                style="width: ${frame.healthPercent}%; background: linear-gradient(90deg, ${frame.color}, rgba(255,255,255,0.12));"
              ></div>
            </div>
          </article>
        `,
      )
      .join("");

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
    game.setMode(role);

    for (const roleButton of prepullRoleButtons) {
      roleButton.classList.toggle("is-selected", roleButton.dataset.role === role);
    }
  });
}

pulltimerButton.addEventListener("click", () => {
  if (pulltimerIntervalId !== null) {
    return;
  }

  let remainingSeconds = 5;
  pulltimerCount.textContent = String(remainingSeconds);
  prepullOverlay.classList.add("is-countdown");
  pulltimerOverlay.setAttribute("aria-hidden", "false");
  pulltimerButton.disabled = true;

  pulltimerIntervalId = window.setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      if (pulltimerIntervalId !== null) {
        window.clearInterval(pulltimerIntervalId);
        pulltimerIntervalId = null;
      }

      prepullOverlay.classList.add("is-hidden");
      game.start();
      return;
    }

    pulltimerCount.textContent = String(remainingSeconds);
  }, 1000);
});

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
