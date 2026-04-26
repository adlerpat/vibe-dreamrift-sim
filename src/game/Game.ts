import { WORLD_HEIGHT, WORLD_WIDTH } from "./constants";
import { InputController } from "./input";
import {
  getHudSnapshot,
  cycleSelectedUnit,
  createInitialState,
  getSelectedUnit,
  getSelectionSummary,
  selectUnitById,
  setGameMode,
  tickEncounter,
  tickCooldowns,
  useAbility,
  type AbilityId,
  type GameMode,
  type HudSnapshot,
  type SelectionSummary,
} from "./state";
import { renderRoom } from "../render/renderRoom";
import { renderUnits } from "../render/renderUnits";

type GameOptions = {
  onSelectionChange: (summary: SelectionSummary) => void;
  onHudChange: (snapshot: HudSnapshot) => void;
};

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly options: GameOptions;
  private readonly input = new InputController();
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private isRunning = false;
  private state = createInitialState();

  constructor(canvas: HTMLCanvasElement, options: GameOptions) {
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("2D canvas context is not available.");
    }

    this.canvas = canvas;
    this.context = context;
    this.options = options;
    this.handleResize = this.handleResize.bind(this);
    this.tick = this.tick.bind(this);

    this.handleResize();
    this.options.onSelectionChange(getSelectionSummary(this.state));
    this.options.onHudChange(getHudSnapshot(this.state));
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    window.addEventListener("resize", this.handleResize);
    this.input.attach();
    this.isRunning = true;
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    window.removeEventListener("resize", this.handleResize);
    this.input.detach();
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resetEncounter(mode?: string): void {
    this.state = createInitialState();

    if (mode && isGameMode(mode)) {
      setGameMode(this.state, mode);
    }

    this.lastFrameTime = 0;
    this.options.onSelectionChange(getSelectionSummary(this.state));
    this.options.onHudChange(getHudSnapshot(this.state));
  }

  setMode(mode: string): void {
    if (!isGameMode(mode)) {
      return;
    }

    const summary = setGameMode(this.state, mode);
    this.options.onSelectionChange(summary);
    this.options.onHudChange(getHudSnapshot(this.state));
  }

  triggerAbility(abilityId: AbilityId): void {
    useAbility(this.state, abilityId);
    this.options.onHudChange(getHudSnapshot(this.state));
  }

  selectRaidUnit(unitId: string): boolean {
    if (this.state.mode !== "raidleader") {
      return false;
    }

    const summary = selectUnitById(this.state, unitId);
    this.options.onSelectionChange(summary);
    this.options.onHudChange(getHudSnapshot(this.state));
    return true;
  }

  private handleResize(): void {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(WORLD_WIDTH * ratio);
    this.canvas.height = Math.floor(WORLD_HEIGHT * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private tick(timestamp: number): void {
    const deltaSeconds = this.lastFrameTime === 0 ? 0 : (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    this.update(deltaSeconds);
    this.render(timestamp / 1000);

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  private update(deltaSeconds: number): void {
    tickCooldowns(this.state, deltaSeconds);
    tickEncounter(this.state, deltaSeconds);

    if (this.state.mode === "raidleader" && this.input.consumeTabPress()) {
      this.options.onSelectionChange(cycleSelectedUnit(this.state));
      this.options.onHudChange(getHudSnapshot(this.state));
    }

    this.handleAbilityInput();

    const unit = getSelectedUnit(this.state);
    const movement = this.input.getMovementVector();
    const magnitude = Math.hypot(movement.x, movement.y) || 1;
    const velocityX = movement.x / magnitude;
    const velocityY = movement.y / magnitude;

    unit.x += velocityX * unit.speed * deltaSeconds;
    unit.y += velocityY * unit.speed * deltaSeconds;

    unit.x = clamp(unit.x, 120 + unit.radius, WORLD_WIDTH - 120 - unit.radius);
    unit.y = clamp(unit.y, 92 + unit.radius, WORLD_HEIGHT - 92 - unit.radius);

    this.options.onHudChange(getHudSnapshot(this.state));
  }

  private render(elapsedSeconds: number): void {
    renderRoom(this.context, {
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      elapsedSeconds,
      phaseVeilActive: getSelectedUnit(this.state).phase === "rift",
      bossAnchor: {
        x: this.state.boss.x,
        y: this.state.boss.y,
        radius: this.state.boss.radius,
      },
      activeCast: this.state.activeSpell
        ? {
            spellId: this.state.activeSpell.spellId,
            label: this.state.activeSpell.label,
            timeRemaining: this.state.activeSpell.timeRemaining,
            totalDuration: this.state.activeSpell.totalDuration,
          }
        : null,
      activeTelegraph: this.state.activeSpell?.telegraph ?? null,
    });
    renderUnits(this.context, {
      units: this.state.units,
      boss: this.state.boss,
      adds: this.state.adds,
      selectedUnitId: this.state.selectedUnitId,
      selectedUnitPhase: getSelectedUnit(this.state).phase,
    });
  }

  private handleAbilityInput(): void {
    const abilities: AbilityId[] = ["melee", "ranged", "role"];

    for (const abilityId of abilities) {
      if (!this.input.consumeAbilityPress(abilityId)) {
        continue;
      }

      useAbility(this.state, abilityId);
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isGameMode(value: string): value is GameMode {
  return value === "tank" || value === "damage" || value === "healer" || value === "raidleader";
}
