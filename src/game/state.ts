import {
  chimaerusConfig,
  type EncounterPhase,
  type ScheduledSpellConfig,
  type SpellId,
} from "../data/bosses/chimaerus";

export type Role = "tank" | "damage" | "healer";
export type GameMode = Role | "raidleader";
export type AbilityId = "melee" | "ranged" | "role";
export type TelegraphShape = "circle" | "line";
export type AddKind = "colossal_horror" | "swarming_shade";
export type PhaseLayer = "material" | "rift";

export type Unit = {
  id: string;
  name: string;
  role: Role;
  phase: PhaseLayer;
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  hp: number;
  maxHp: number;
  pendingRecoverySeconds: number;
};

export type Boss = {
  name: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: PhaseLayer;
  hp: number;
  maxHp: number;
  energy: number;
  visible: boolean;
  attackable: boolean;
  damageBoostStacks: number;
  targetUnitId: string | null;
};

export type EncounterAdd = {
  id: string;
  kind: AddKind;
  name: string;
  phase: PhaseLayer;
  targetTankId: string | null;
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  color: string;
};

export type GroundTelegraph = {
  id: string;
  label: string;
  shape: TelegraphShape;
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  angle?: number;
  timeRemaining: number;
  totalDuration: number;
};

export type ActiveSpell = {
  spellId: SpellId;
  label: string;
  timeRemaining: number;
  totalDuration: number;
  telegraph: GroundTelegraph | null;
  payload?: Record<string, string | number>;
};

export type QueuedSpell = {
  spellId: SpellId;
  source: "cooldown" | "chance_window" | "follow_up" | "energy" | "phase_timer";
  priority: number;
};

export type CombatLogEntry = {
  id: string;
  text: string;
  emphasis?: "damage" | "heal" | "utility";
};

export type AbilityView = {
  id: AbilityId;
  slotLabel: "1" | "2" | "3";
  name: string;
  description: string;
  cooldownRemaining: number;
  cooldownDuration: number;
  ready: boolean;
};

export type HudSnapshot = {
  unitName: string;
  roleLabel: string;
  unitHp: number;
  unitMaxHp: number;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  encounterFinished: boolean;
  bossCastLabel: string | null;
  bossCastRemaining: number;
  selectedUnitPhase: PhaseLayer;
  raidFrames: Array<{
    id: string;
    name: string;
    roleLabel: string;
    hp: number;
    maxHp: number;
    healthPercent: number;
    color: string;
  }>;
  abilities: AbilityView[];
  logEntries: CombatLogEntry[];
};

export type GameState = {
  mode: GameMode;
  selectedUnitId: string;
  units: Unit[];
  boss: Boss;
  aggro: Record<string, number>;
  adds: EncounterAdd[];
  cooldowns: Record<AbilityId, number>;
  logEntries: CombatLogEntry[];
  encounterFinished: boolean;
  encounterTime: number;
  phase: EncounterPhase;
  phaseTime: number;
  activeSpell: ActiveSpell | null;
  spellQueue: QueuedSpell[];
  spellCooldowns: Record<string, number>;
  spellCastCounts: Record<string, number>;
  spellChanceCheckTimers: Record<string, number>;
  spellPhaseFlags: Record<string, boolean>;
  raidAutoAttackTimer: number;
  lastAlndustTankId: string | null;
  pendingConsumeAfterRift: boolean;
  consumeDelay: number;
  intermissionDevastationsRemaining: number;
  intermissionSpellDelay: number;
  pendingRavenousDive: boolean;
};

export type SelectionSummary = {
  selectedRole: GameMode;
  unitId: string;
  unitName: string;
  roleLabel: string;
  hintText: string;
};

const MAX_LOG_ENTRIES = 5;
const DEBUG_ENCOUNTER = true;

export function createInitialState(): GameState {
  const units: Unit[] = [
    {
      id: "tank-1",
      name: "Brom",
      role: "tank",
      phase: "material",
      x: 560,
      y: 276,
      radius: 18,
      speed: 210,
      color: "#4fa7d8",
      hp: 150,
      maxHp: 150,
      pendingRecoverySeconds: 0,
    },
    {
      id: "tank-2",
      name: "Serah",
      role: "tank",
      phase: "material",
      x: 720,
      y: 276,
      radius: 18,
      speed: 210,
      color: "#57bee8",
      hp: 150,
      maxHp: 150,
      pendingRecoverySeconds: 0,
    },
    {
      id: "damage-1",
      name: "Ariyn",
      role: "damage",
      phase: "material",
      x: 514,
      y: 496,
      radius: 16,
      speed: 250,
      color: "#d87552",
      hp: 110,
      maxHp: 110,
      pendingRecoverySeconds: 0,
    },
    {
      id: "damage-2",
      name: "Kael",
      role: "damage",
      phase: "material",
      x: 766,
      y: 496,
      radius: 16,
      speed: 250,
      color: "#ef9568",
      hp: 110,
      maxHp: 110,
      pendingRecoverySeconds: 0,
    },
    {
      id: "healer-1",
      name: "Mira",
      role: "healer",
      phase: "material",
      x: 596,
      y: 548,
      radius: 16,
      speed: 230,
      color: "#96df84",
      hp: 100,
      maxHp: 100,
      pendingRecoverySeconds: 0,
    },
    {
      id: "healer-2",
      name: "Thalen",
      role: "healer",
      phase: "material",
      x: 684,
      y: 548,
      radius: 16,
      speed: 230,
      color: "#c4f0a4",
      hp: 100,
      maxHp: 100,
      pendingRecoverySeconds: 0,
    },
  ];

  return {
    mode: "damage",
    selectedUnitId: "damage-1",
    units,
    boss: {
      name: "Kimärus",
      x: 640,
      y: 324,
      radius: 42,
      speed: 116,
      phase: "material",
      hp: 5200,
      maxHp: 5200,
      energy: 0,
      visible: true,
      attackable: true,
      damageBoostStacks: 0,
      targetUnitId: "tank-1",
    },
    aggro: {
      "tank-1": 120,
      "tank-2": 90,
      "damage-1": 28,
      "damage-2": 28,
      "healer-1": 20,
      "healer-2": 20,
    },
    adds: [],
    cooldowns: {
      melee: 0,
      ranged: 0,
      role: 0,
    },
    logEntries: [
      {
        id: crypto.randomUUID(),
        text: "Kimärus stirs. Watch for Alndust Upheaval and stop the adds before they reach him.",
        emphasis: "utility",
      },
    ],
    encounterFinished: false,
    encounterTime: 0,
    phase: "phase_1",
    phaseTime: 0,
    activeSpell: null,
    spellQueue: [],
    spellCooldowns: {},
    spellCastCounts: {},
    spellChanceCheckTimers: {},
    spellPhaseFlags: {},
    raidAutoAttackTimer: 0,
    lastAlndustTankId: null,
    pendingConsumeAfterRift: false,
    consumeDelay: 0,
    intermissionDevastationsRemaining: 0,
    intermissionSpellDelay: 0,
    pendingRavenousDive: false,
  };
}

export function getSelectedUnit(state: GameState): Unit {
  const selectedUnit = state.units.find((unit) => unit.id === state.selectedUnitId);

  if (!selectedUnit) {
    throw new Error(`Selected unit "${state.selectedUnitId}" was not found.`);
  }

  return selectedUnit;
}

export function setGameMode(state: GameState, mode: GameMode): SelectionSummary {
  state.mode = mode;
  const nextUnit = selectUnitForMode(state, mode);
  state.selectedUnitId = nextUnit.id;
  resetCooldowns(state);
  addLogEntry(
    state,
    `Role focus shifted to ${nextUnit.name}. ${getRoleActionName(nextUnit.role)} is now on the action bar.`,
    "utility",
  );
  return getSelectionSummary(state);
}

export function cycleSelectedUnit(state: GameState): SelectionSummary {
  const currentIndex = state.units.findIndex((unit) => unit.id === state.selectedUnitId);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % state.units.length : 0;
  state.selectedUnitId = state.units[nextIndex].id;
  resetCooldowns(state);
  addLogEntry(
    state,
    `Raidleader focus moved to ${state.units[nextIndex].name}.`,
    "utility",
  );
  return getSelectionSummary(state);
}

export function selectUnitById(state: GameState, unitId: string): SelectionSummary {
  const targetUnit = state.units.find((unit) => unit.id === unitId);

  if (!targetUnit) {
    throw new Error(`Unit "${unitId}" was not found.`);
  }

  state.selectedUnitId = targetUnit.id;
  resetCooldowns(state);

  if (state.mode === "raidleader") {
    addLogEntry(state, `Raidleader focus moved to ${targetUnit.name}.`, "utility");
  }

  return getSelectionSummary(state);
}

export function tickCooldowns(state: GameState, deltaSeconds: number): void {
  for (const abilityId of Object.keys(state.cooldowns) as AbilityId[]) {
    state.cooldowns[abilityId] = Math.max(0, state.cooldowns[abilityId] - deltaSeconds);
  }
}

export function tickEncounter(state: GameState, deltaSeconds: number): void {
  if (state.encounterFinished) {
    return;
  }

  state.encounterTime += deltaSeconds;
  state.phaseTime += deltaSeconds;
  state.raidAutoAttackTimer += deltaSeconds;

  if (state.phase === "phase_1" && state.boss.attackable) {
    state.boss.energy = Math.min(
      100,
      state.boss.energy + chimaerusConfig.phases.phase_1.energyPerSecond * deltaSeconds,
    );
  }

  tickSpellCooldowns(state, deltaSeconds);
  tickActiveSpell(state, deltaSeconds);
  tickPendingConsume(state, deltaSeconds);
  tickIntermissionSequence(state, deltaSeconds);
  tickBossAggro(state);
  tickBossMovement(state, deltaSeconds);
  tickAdds(state, deltaSeconds);
  tickRaidAutoAttacks(state);
  tickPassiveRecovery(state, deltaSeconds);

  if (state.encounterFinished) {
    return;
  }

  if (hasRaidWiped(state)) {
    state.encounterFinished = true;
    addLogEntry(state, "The raid has fallen.", "damage");
    return;
  }

  evaluateSpellSchedules(state);

  if (!state.activeSpell) {
    startNextQueuedSpell(state);
  }

  if (state.boss.hp <= 0) {
    state.encounterFinished = true;
    addLogEntry(state, "Kimärus collapses. Prototype victory.", "utility");
  }
}

export function useAbility(state: GameState, abilityId: AbilityId): boolean {
  if (state.cooldowns[abilityId] > 0 || state.encounterFinished) {
    return false;
  }

  const unit = getSelectedUnit(state);
  const addTarget = getPrimaryAddTarget(state);

  if (abilityId === "melee") {
    if (addTarget) {
      if (!isInAddRange(unit, addTarget, 52)) {
        addLogEntry(state, `${unit.name} is too far away to strike ${addTarget.name}.`, "utility");
        return false;
      }

      dealDamageToAdd(state, addTarget, 42, `${unit.name} cleaves ${addTarget.name} for 42 damage.`);
      addAggro(state, unit.id, 22);
      state.cooldowns.melee = 1.1;
      return true;
    }

    if (!state.boss.attackable || unit.phase !== state.boss.phase || !isInRange(unit, state.boss, 88)) {
      addLogEntry(state, `${unit.name} is too far away to land a melee strike.`, "utility");
      return false;
    }

    dealDamageToBoss(state, 42, `${unit.name} slashes Kimärus for 42 damage.`);
    addAggro(state, unit.id, 42);
    state.cooldowns.melee = 1.1;
    return true;
  }

  if (abilityId === "ranged") {
    if (addTarget) {
      dealDamageToAdd(state, addTarget, 26, `${unit.name} shoots ${addTarget.name} for 26 damage.`);
      addAggro(state, unit.id, 16);
      state.cooldowns.ranged = 1.8;
      return true;
    }

    if (!state.boss.attackable || unit.phase !== state.boss.phase) {
      addLogEntry(state, "Kimärus is not attackable right now.", "utility");
      return false;
    }

    dealDamageToBoss(state, 26, `${unit.name} lands a ranged hit on Kimärus for 26 damage.`);
    addAggro(state, unit.id, 26);
    state.cooldowns.ranged = 1.8;
    return true;
  }

  return useRoleAbility(state, unit);
}

export function getSelectionSummary(state: GameState): SelectionSummary {
  const unit = getSelectedUnit(state);

  return {
    selectedRole: state.mode,
    unitId: unit.id,
    unitName: unit.name,
    roleLabel: getRoleLabel(unit.role),
    hintText:
      state.mode === "raidleader"
        ? "Raidleader mode can move one raider at a time for now. Press Tab to cycle through the raid."
        : `Move ${unit.name} with WASD and use 1, 2, and 3 to handle Kimärus's casts and add waves.`,
  };
}

export function getHudSnapshot(state: GameState): HudSnapshot {
  const unit = getSelectedUnit(state);
  const roleAction = getRoleAction(unit.role);

  return {
    unitName: unit.name,
    roleLabel: getRoleLabel(unit.role),
    unitHp: unit.hp,
    unitMaxHp: unit.maxHp,
    bossName: state.boss.name,
    bossHp: state.boss.hp,
    bossMaxHp: state.boss.maxHp,
    encounterFinished: state.encounterFinished,
    bossCastLabel: state.activeSpell?.label ?? null,
    bossCastRemaining: state.activeSpell?.timeRemaining ?? 0,
    selectedUnitPhase: unit.phase,
    raidFrames: state.units.map((raidUnit) => ({
      id: raidUnit.id,
      name: raidUnit.name,
      roleLabel: getRoleLabel(raidUnit.role),
      hp: raidUnit.hp,
      maxHp: raidUnit.maxHp,
      healthPercent: raidUnit.maxHp <= 0 ? 0 : (raidUnit.hp / raidUnit.maxHp) * 100,
      color: raidUnit.color,
    })),
    abilities: [
      {
        id: "melee",
        slotLabel: "1",
        name: "Melee Attack",
        description: "Heavy damage up close. Prioritises active adds.",
        cooldownRemaining: state.cooldowns.melee,
        cooldownDuration: 1.1,
        ready: state.cooldowns.melee <= 0,
      },
      {
        id: "ranged",
        slotLabel: "2",
        name: "Ranged Attack",
        description: "Reliable ranged damage. Prioritises active adds.",
        cooldownRemaining: state.cooldowns.ranged,
        cooldownDuration: 1.8,
        ready: state.cooldowns.ranged <= 0,
      },
      {
        id: "role",
        slotLabel: "3",
        name: roleAction.name,
        description: roleAction.description,
        cooldownRemaining: state.cooldowns.role,
        cooldownDuration: roleAction.cooldown,
        ready: state.cooldowns.role <= 0,
      },
    ],
    logEntries: state.logEntries,
  };
}

function tickSpellCooldowns(state: GameState, deltaSeconds: number): void {
  for (const key of Object.keys(state.spellCooldowns)) {
    state.spellCooldowns[key] = Math.max(0, state.spellCooldowns[key] - deltaSeconds);
  }

  for (const key of Object.keys(state.spellChanceCheckTimers)) {
    state.spellChanceCheckTimers[key] = Math.max(0, state.spellChanceCheckTimers[key] - deltaSeconds);
  }
}

function tickBossAggro(state: GameState): void {
  if (!state.boss.visible || state.phase !== "phase_1") {
    state.boss.targetUnitId = null;
    return;
  }

  let highestUnit: Unit | null = null;
  let highestAggro = -Infinity;

  for (const unit of getLivingTanks(state, "material")) {
    if (unit.hp <= 0) {
      continue;
    }

    const aggro = state.aggro[unit.id] ?? 0;

    if (aggro > highestAggro) {
      highestAggro = aggro;
      highestUnit = unit;
    }
  }

  state.boss.targetUnitId = highestUnit?.id ?? null;
}

function tickBossMovement(state: GameState, deltaSeconds: number): void {
  if (!state.boss.visible) {
    return;
  }

  if (state.phase === "intermission") {
    moveBossTowardPoint(state.boss, 640, 92, deltaSeconds);
    return;
  }

  const targetUnit = getBossTargetUnit(state);

  if (!targetUnit) {
    moveBossTowardPoint(state.boss, 640, 324, deltaSeconds);
    return;
  }

  moveBossTowardUnit(state.boss, targetUnit, 94, deltaSeconds);
}

function tickActiveSpell(state: GameState, deltaSeconds: number): void {
  if (!state.activeSpell) {
    return;
  }

  state.activeSpell.timeRemaining = Math.max(0, state.activeSpell.timeRemaining - deltaSeconds);

  if (state.activeSpell.telegraph) {
    state.activeSpell.telegraph.timeRemaining = state.activeSpell.timeRemaining;
  }

  if (state.activeSpell.timeRemaining > 0) {
    return;
  }

  resolveSpell(state, state.activeSpell);
  state.activeSpell = null;
}

function tickIntermissionSequence(state: GameState, deltaSeconds: number): void {
  if (state.phase !== "intermission" || state.activeSpell) {
    return;
  }

  if (state.intermissionSpellDelay > 0) {
    state.intermissionSpellDelay = Math.max(0, state.intermissionSpellDelay - deltaSeconds);
  }

  if (state.intermissionSpellDelay > 0) {
    return;
  }

  if (state.intermissionDevastationsRemaining > 0) {
    queueSpellById(state, "corrupted_devastation", "phase_timer");
    state.intermissionDevastationsRemaining -= 1;
    state.intermissionSpellDelay = 0.8;
    return;
  }

  if (state.pendingRavenousDive) {
    queueSpellById(state, "ravenous_dive", "phase_timer");
    state.pendingRavenousDive = false;
  }
}

function tickPendingConsume(state: GameState, deltaSeconds: number): void {
  if (!state.pendingConsumeAfterRift || state.phase !== "phase_1") {
    return;
  }

  state.consumeDelay = Math.max(0, state.consumeDelay - deltaSeconds);

  if (state.consumeDelay > 0) {
    return;
  }

  if (state.activeSpell || state.spellQueue.some((spell) => spell.spellId === "consume")) {
    if (DEBUG_ENCOUNTER) {
      debugEncounter(
        `consume waiting: active=${state.activeSpell?.spellId ?? "none"} queue=${state.spellQueue.map((spell) => spell.spellId).join(",") || "empty"}`,
      );
    }
    return;
  }

  queueSpellById(state, "consume", "follow_up");
  state.pendingConsumeAfterRift = false;
  if (DEBUG_ENCOUNTER) {
    debugEncounter(`consume queued at ${state.encounterTime.toFixed(1)}s`);
  }
}

function tickPassiveRecovery(state: GameState, deltaSeconds: number): void {
  if (state.encounterFinished) {
    return;
  }

  for (const unit of state.units) {
    if (unit.role === "healer" || unit.hp <= 0 || unit.hp >= unit.maxHp || unit.pendingRecoverySeconds <= 0) {
      continue;
    }

    unit.pendingRecoverySeconds = Math.max(0, unit.pendingRecoverySeconds - deltaSeconds);

    if (unit.pendingRecoverySeconds <= 0) {
      unit.hp = unit.maxHp;
      addLogEntry(state, `${unit.name} recovers from the hit and returns to full health.`, "heal");
    }
  }
}

function evaluateSpellSchedules(state: GameState): void {
  const schedule = chimaerusConfig.phases[state.phase];

  for (const spellConfig of schedule.spells) {
    if (
      spellConfig.id === "alndust_upheaval" &&
      (state.pendingConsumeAfterRift ||
        state.activeSpell?.spellId === "consume" ||
        state.spellQueue.some((spell) => spell.spellId === "consume"))
    ) {
      continue;
    }

    if (state.activeSpell?.spellId === spellConfig.id || state.spellQueue.some((spell) => spell.spellId === spellConfig.id)) {
      continue;
    }

    if (spellConfig.rule.type === "cooldown") {
      if (state.spellCooldowns[spellConfig.id] === undefined) {
        state.spellCooldowns[spellConfig.id] = spellConfig.rule.initialDelay;
      }

      if (state.spellCooldowns[spellConfig.id] <= 0) {
        queueSpell(state, spellConfig, "cooldown");
        state.spellCooldowns[spellConfig.id] = spellConfig.rule.interval;
      }

      continue;
    }

    if (spellConfig.rule.type === "chance_window") {
      if (state.spellChanceCheckTimers[spellConfig.id] === undefined) {
        state.spellChanceCheckTimers[spellConfig.id] = spellConfig.rule.initialDelay;
      }

      if (state.spellChanceCheckTimers[spellConfig.id] <= 0) {
        const roll = Math.random();

        if (roll <= spellConfig.rule.chance) {
          queueSpell(state, spellConfig, "chance_window");
        }

        state.spellChanceCheckTimers[spellConfig.id] = spellConfig.rule.checkEvery;
      }

      continue;
    }

    if (spellConfig.rule.type === "energy") {
      if (state.boss.energy >= spellConfig.rule.threshold) {
        queueSpell(state, spellConfig, "energy");
      }

      continue;
    }

    if (spellConfig.rule.type === "phase_timer") {
      if (state.spellPhaseFlags[spellConfig.id]) {
        continue;
      }

      if (state.phaseTime >= spellConfig.rule.at) {
        queueSpell(state, spellConfig, "phase_timer");
        state.spellPhaseFlags[spellConfig.id] = true;
      }
    }
  }
}

function queueSpell(
  state: GameState,
  spellConfig: ScheduledSpellConfig,
  source: QueuedSpell["source"],
): void {
  state.spellQueue.push({
    spellId: spellConfig.id,
    source,
    priority: spellConfig.priority,
  });
}

function queueSpellById(state: GameState, spellId: SpellId, source: QueuedSpell["source"]): void {
  state.spellQueue.push({
    spellId,
    source,
    priority: getSpellPriority(spellId),
  });

  if (DEBUG_ENCOUNTER) {
    debugEncounter(`queued ${spellId} via ${source}`);
  }
}

function startNextQueuedSpell(state: GameState): void {
  if (state.spellQueue.length === 0) {
    return;
  }

  state.spellQueue.sort((left, right) => right.priority - left.priority);
  const nextSpell = state.spellQueue.shift();

  if (!nextSpell) {
    return;
  }

  state.activeSpell = createActiveSpell(state, nextSpell.spellId);

  if (DEBUG_ENCOUNTER) {
    debugEncounter(`start ${nextSpell.spellId}`);
  }

  if (nextSpell.spellId === "consume") {
    beginConsumeCast(state);
  }
}

function createActiveSpell(state: GameState, spellId: SpellId): ActiveSpell {
  const selectedUnit = getSelectedUnit(state);
  const bossTargetUnit = getBossTargetUnit(state) ?? getLivingTanks(state, "material")[0] ?? selectedUnit;

  if (spellId === "alndust_upheaval") {
    return {
      spellId,
      label: "Alndust Upheaval",
      timeRemaining: 5,
      totalDuration: 5,
      payload: {
        targetTankId: bossTargetUnit.id,
      },
      telegraph: {
        id: crypto.randomUUID(),
        label: "Alndust Upheaval",
        shape: "circle",
        x: bossTargetUnit.x,
        y: bossTargetUnit.y,
        radius: 70,
        timeRemaining: 5,
        totalDuration: 5,
      },
    };
  }

  if (spellId === "rending_tear") {
    const dx = bossTargetUnit.x - state.boss.x;
    const dy = bossTargetUnit.y - state.boss.y;

    return {
      spellId,
      label: "Rending Tear",
      timeRemaining: 2.5,
      totalDuration: 2.5,
      telegraph: {
        id: crypto.randomUUID(),
        label: "Rending Tear",
        shape: "line",
        x: state.boss.x,
        y: state.boss.y,
        width: Math.hypot(dx, dy),
        height: 84,
        angle: Math.atan2(dy, dx),
        timeRemaining: 2.5,
        totalDuration: 2.5,
      },
    };
  }

  if (spellId === "consume") {
    return {
      spellId,
      label: "Consume",
      timeRemaining: 2.5,
      totalDuration: 2.5,
      telegraph: null,
    };
  }

  if (spellId === "corrupted_devastation") {
    const lane = pickIntermissionLane(state);

    return {
      spellId,
      label: "Corrupted Devastation",
      timeRemaining: 5,
      totalDuration: 5,
      telegraph: {
        id: crypto.randomUUID(),
        label: "Corrupted Devastation",
        shape: "line",
        x: 640,
        y: lane,
        width: 1120,
        height: 92,
        angle: 0,
        timeRemaining: 5,
        totalDuration: 5,
      },
    };
  }

  if (spellId === "ravenous_dive") {
    return {
      spellId,
      label: "Ravenous Dive",
      timeRemaining: 5,
      totalDuration: 5,
      telegraph: {
        id: crypto.randomUUID(),
        label: "Ravenous Dive",
        shape: "circle",
        x: state.boss.x,
        y: state.boss.y,
        radius: 160,
        timeRemaining: 5,
        totalDuration: 5,
      },
    };
  }

  return {
    spellId,
    label: "Rift Emergence",
    timeRemaining: 3,
    totalDuration: 3,
    telegraph: null,
  };
}

function resolveSpell(state: GameState, activeSpell: ActiveSpell): void {
  state.spellCastCounts[activeSpell.spellId] = (state.spellCastCounts[activeSpell.spellId] ?? 0) + 1;

  if (DEBUG_ENCOUNTER) {
    debugEncounter(`resolve ${activeSpell.spellId}`);
  }

  if (activeSpell.spellId === "alndust_upheaval") {
    resolveAlndustUpheaval(state, activeSpell);
    queueSpellById(state, "rift_emergence", "follow_up");
    return;
  }

  if (activeSpell.spellId === "rift_emergence") {
    spawnRiftAdds(state);
    return;
  }

  if (activeSpell.spellId === "rending_tear") {
    resolveRendingTear(state, activeSpell);
    return;
  }

  if (activeSpell.spellId === "consume") {
    resolveConsume(state);
    return;
  }

  if (activeSpell.spellId === "corrupted_devastation") {
    resolveCorruptedDevastation(state, activeSpell);
    return;
  }

  if (activeSpell.spellId === "ravenous_dive") {
    resolveRavenousDive(state);
  }
}

function resolveAlndustUpheaval(state: GameState, activeSpell: ActiveSpell): void {
  const telegraph = activeSpell.telegraph;

  if (!telegraph || !telegraph.radius) {
    return;
  }

  const radius = telegraph.radius;
  const soakTargets = state.units;
  const soakingUnits = soakTargets.filter((unit) => isInsideCircle(unit, telegraph.x, telegraph.y, radius));
  const targetTankId = typeof activeSpell.payload?.targetTankId === "string" ? activeSpell.payload.targetTankId : null;
  const targetTank = targetTankId
    ? state.units.find((unit) => unit.id === targetTankId && unit.role === "tank")
    : null;
  const targetTankSoaked = targetTank ? soakingUnits.some((unit) => unit.id === targetTank.id) : false;

  if (targetTankSoaked) {
    for (const unit of soakingUnits) {
      unit.phase = "rift";
    }

    if (targetTankId) {
      state.lastAlndustTankId = targetTankId;
      handOffBossAggroToOtherTank(state, targetTankId);
    }

    state.pendingConsumeAfterRift = true;
    state.consumeDelay = 15;
    addLogEntry(state, "Consume is primed and will resolve in 15 seconds.", "utility");

    if (DEBUG_ENCOUNTER) {
      debugEncounter(
        `upheaval soaked: tank=${targetTankId ?? "none"} soakers=${soakingUnits.map((unit) => unit.name).join(",")} consume=${state.pendingConsumeAfterRift ? `${state.consumeDelay}s` : "no"}`,
      );
    }

    addLogEntry(state, `Alndust Upheaval is soaked by ${soakingUnits.map((unit) => unit.name).join(", ")}.`, "utility");
    return;
  }

  for (const unit of state.units) {
    applyDamageToUnit(state, unit, 26);
  }

  if (DEBUG_ENCOUNTER) {
    debugEncounter(
      `upheaval failed: tank=${targetTankId ?? "none"} soakers=${soakingUnits.map((unit) => unit.name).join(",") || "none"}`,
    );
  }

  addLogEntry(state, "Alndust Upheaval was under-soaked and rocks the raid.", "damage");
}

function spawnRiftAdds(state: GameState): void {
  const targetTankId = state.lastAlndustTankId;
  state.adds.push(
    createAdd("colossal_horror", 472, 470, "rift", targetTankId),
    createAdd("swarming_shade", 804, 190, "rift", targetTankId),
    createAdd("swarming_shade", 850, 458, "rift", targetTankId),
  );
  const targetTank = targetTankId
    ? state.units.find((unit) => unit.id === targetTankId && unit.role === "tank")
    : null;
  addLogEntry(
    state,
    targetTank
      ? `Rift Emergence tears open the room and Manifestations surge toward ${targetTank.name} in the Rift.`
      : "Rift Emergence tears open the room and Manifestations surge in.",
    "utility",
  );

  if (DEBUG_ENCOUNTER) {
    debugEncounter(`rift adds spawned for tank=${targetTankId ?? "none"}`);
  }
}

function resolveRendingTear(state: GameState, activeSpell: ActiveSpell): void {
  const telegraph = activeSpell.telegraph;

  if (!telegraph || telegraph.shape !== "line" || !telegraph.width || !telegraph.height || telegraph.angle === undefined) {
    return;
  }

  const targets = state.mode === "raidleader" ? state.units : [getSelectedUnit(state)];
  const width = telegraph.width;
  const height = telegraph.height;
  const angle = telegraph.angle;
  const hitUnits = targets.filter((unit) => isInsideLine(unit, telegraph.x, telegraph.y, width, height, angle));

  if (hitUnits.length === 0) {
    addLogEntry(state, "Rending Tear whiffs through empty space.", "utility");
    return;
  }

  for (const unit of hitUnits) {
    applyDamageToUnit(state, unit, 28);
  }

  addLogEntry(state, `Rending Tear slices through ${hitUnits.map((unit) => unit.name).join(", ")}.`, "damage");
}

function resolveConsume(state: GameState): void {
  const addCount = state.adds.length;

  if (DEBUG_ENCOUNTER) {
    debugEncounter(`consume resolve: addsAlive=${addCount} at ${state.encounterTime.toFixed(1)}s`);
  }

  if (addCount > 0) {
    applyInsatiable(state, addCount, "Consume devours lingering Manifestations before the intermission.");
    state.adds = [];

    if (state.units.every((unit) => unit.hp <= 0)) {
      state.encounterFinished = true;
      addLogEntry(state, "The raid is overwhelmed as Consume devours too many lingering Manifestations.", "damage");
      return;
    }
  }

  addLogEntry(state, "Kimärus casts Consume and the room buckles into intermission.", "utility");

  state.adds = [];
  state.phase = "intermission";
  state.phaseTime = 0;
  state.boss.energy = 0;
  state.boss.visible = true;
  state.boss.attackable = false;
  state.boss.phase = "material";
  state.boss.targetUnitId = null;
  state.lastAlndustTankId = null;
  state.pendingConsumeAfterRift = false;
  state.consumeDelay = 0;
  state.intermissionDevastationsRemaining = 3;
  state.intermissionSpellDelay = 2.8;
  state.pendingRavenousDive = false;
  for (const unit of state.units) {
    unit.phase = "material";
  }
  state.spellQueue = [];
  state.spellCooldowns = {};
  state.spellChanceCheckTimers = {};
  state.spellPhaseFlags = {};
  addLogEntry(state, "Kimärus slips out of reach and retreats toward the edge of the room.", "utility");
}

function beginConsumeCast(state: GameState): void {
  for (const unit of state.units) {
    unit.phase = "material";
  }

  for (const add of state.adds) {
    add.phase = "material";
    add.targetTankId = null;
  }

  if (DEBUG_ENCOUNTER) {
    debugEncounter("consume cast began: raid and adds returned to boss phase");
  }
}

function resolveCorruptedDevastation(state: GameState, activeSpell: ActiveSpell): void {
  const telegraph = activeSpell.telegraph;

  if (!telegraph || telegraph.shape !== "line" || !telegraph.width || !telegraph.height || telegraph.angle === undefined) {
    return;
  }

  const targets = state.mode === "raidleader" ? state.units : [getSelectedUnit(state)];
  const width = telegraph.width;
  const height = telegraph.height;
  const angle = telegraph.angle;
  const hitUnits = targets.filter((unit) =>
    isInsideLine(unit, telegraph.x - width / 2, telegraph.y, width, height, angle),
  );

  for (const unit of hitUnits) {
    applyDamageToUnit(state, unit, 34);
  }

  state.adds.push(
    createAdd("swarming_shade", 240 + Math.random() * 120, telegraph.y - 22, "material", null),
    createAdd("swarming_shade", 980 - Math.random() * 120, telegraph.y + 22, "material", null),
  );

  addLogEntry(
    state,
    hitUnits.length > 0
      ? `Corrupted Devastation tears through ${hitUnits.map((unit) => unit.name).join(", ")}.`
      : "Corrupted Devastation sweeps the room and spawns more Manifestations.",
    hitUnits.length > 0 ? "damage" : "utility",
  );

  if (state.phase === "intermission" && state.intermissionDevastationsRemaining === 0) {
    state.pendingRavenousDive = true;
    state.intermissionSpellDelay = 1.2;
  }
}

function resolveRavenousDive(state: GameState): void {
  if (state.adds.length > 0) {
    applyInsatiable(state, state.adds.length, "Ravenous Dive lands while adds are still alive.");
    state.adds = [];
  } else {
    addLogEntry(state, "Ravenous Dive slams the room and the fight restarts.", "utility");
  }

  state.phase = "phase_1";
  state.phaseTime = 0;
  state.boss.visible = true;
  state.boss.attackable = true;
  state.boss.phase = "material";
  state.boss.energy = 0;
  state.boss.x = 640;
  state.boss.y = 188;
  for (const unit of state.units) {
    unit.phase = "material";
  }
  seedAggroAfterDive(state);
  tickBossAggro(state);
  state.spellQueue = [];
  state.spellCooldowns = {};
  state.spellChanceCheckTimers = {};
  state.spellPhaseFlags = {};
  state.pendingConsumeAfterRift = false;
  state.consumeDelay = 0;
  state.intermissionDevastationsRemaining = 0;
  state.intermissionSpellDelay = 0;
  state.pendingRavenousDive = false;
  const aggroTarget = getBossTargetUnit(state);
  addLogEntry(
    state,
    aggroTarget
      ? `Kimärus crashes back in with Ravenous Dive and locks onto ${aggroTarget.name}.`
      : "Kimärus crashes back in with Ravenous Dive and searches for a new target.",
    "utility",
  );
}

function tickAdds(state: GameState, deltaSeconds: number): void {
  if (state.adds.length === 0) {
    return;
  }

  const survivingAdds: EncounterAdd[] = [];

  for (const add of state.adds) {
    tickAddMovement(state, add, deltaSeconds);

    if (add.phase === "material" && state.boss.attackable && hasAddReachedBoss(add, state.boss)) {
      applyInsatiable(state, 1, `${add.name} reaches Kimärus and is consumed.`);
      continue;
    }

    if (add.hp > 0) {
      survivingAdds.push(add);
    }
  }

  state.adds = survivingAdds;

  if (!state.adds.some((add) => add.phase === "rift")) {
    releaseRaidFromRift(state);
  }
}

function tickRaidAutoAttacks(state: GameState): void {
  if (state.raidAutoAttackTimer < 1.15) {
    return;
  }

  state.raidAutoAttackTimer = 0;

  const selectedUnit = getSelectedUnit(state);
  const supportingRaid = state.units.filter((unit) => unit.id !== selectedUnit.id);
  const targetAdd = getPrimaryAddTarget(state);

  if (targetAdd) {
    let totalDamage = 0;

    for (const unit of supportingRaid) {
      if (unit.phase !== targetAdd.phase) {
        continue;
      }

      totalDamage += unit.role === "healer" ? 2 : unit.role === "tank" ? 3 : 6;
      addAggro(state, unit.id, unit.role === "healer" ? 3 : unit.role === "tank" ? 10 : 8);
    }

    dealDamageToAdd(state, targetAdd, totalDamage);
    return;
  }

  if (!state.boss.attackable || selectedUnit.phase !== state.boss.phase) {
    return;
  }

  let totalDamage = 0;

  for (const unit of supportingRaid) {
    if (unit.phase !== state.boss.phase) {
      continue;
    }

    totalDamage += unit.role === "healer" ? 4 : unit.role === "tank" ? 7 : 9;
    addAggro(state, unit.id, unit.role === "healer" ? 2 : unit.role === "tank" ? 9 : 7);
  }

  dealDamageToBoss(state, totalDamage);
}

function useRoleAbility(state: GameState, unit: Unit): boolean {
  const addTarget = getPrimaryAddTarget(state);

  if (unit.role === "tank") {
    state.cooldowns.role = 7;

    if (addTarget) {
      dealDamageToAdd(state, addTarget, 24, `${unit.name} slams ${addTarget.name} and braces for impact.`);
      addAggro(state, unit.id, 36);
    } else if (state.boss.attackable && unit.phase === state.boss.phase) {
      dealDamageToBoss(state, 18, `${unit.name} uses Guard Slam on Kimärus.`);
      addAggro(state, unit.id, 90);
    }

    unit.hp = Math.min(unit.maxHp, unit.hp + 8);
    return true;
  }

  if (unit.role === "healer") {
    const target = getLowestHealthUnit(state.units);
    const healAmount = 34;
    const healedFor = Math.min(healAmount, target.maxHp - target.hp);

    if (healedFor <= 0) {
      addLogEntry(state, `${unit.name} finds no urgent healing target.`, "utility");
      return false;
    }

    target.hp += healedFor;
    state.cooldowns.role = 4.5;
    addAggro(state, unit.id, 18);
    addLogEntry(state, `${unit.name} restores ${healedFor} health to ${target.name}.`, "heal");
    return true;
  }

  state.cooldowns.role = 5.5;

  if (addTarget) {
    dealDamageToAdd(state, addTarget, 64, `${unit.name} unloads Dreamburst into ${addTarget.name}.`);
    addAggro(state, unit.id, 24);
  } else if (state.boss.attackable && unit.phase === state.boss.phase) {
    dealDamageToBoss(state, 64, `${unit.name} unleashes Dreamburst on Kimärus.`);
    addAggro(state, unit.id, 64);
  }

  return true;
}

function applyInsatiable(state: GameState, stackCount: number, text: string): void {
  state.boss.damageBoostStacks += stackCount;

  const raidDamage = 80 * stackCount;

  for (const unit of state.units) {
    applyDamageToUnit(state, unit, raidDamage);
  }

  const missingHealth = state.boss.maxHp - state.boss.hp;
  const healAmount = Math.min(missingHealth, 90 * stackCount);
  state.boss.hp = Math.min(state.boss.maxHp, state.boss.hp + healAmount);

  addLogEntry(state, `${text} Insatiable surges to ${state.boss.damageBoostStacks} stack(s).`, "damage");
}

function applyDamageToUnit(state: GameState, unit: Unit, amount: number): void {
  unit.hp = Math.max(0, unit.hp - amount);

  if (state.encounterFinished || unit.role === "healer" || unit.hp <= 0) {
    unit.pendingRecoverySeconds = 0;
    return;
  }

  unit.pendingRecoverySeconds = 2;
}

function getLowestHealthUnit(units: Unit[]): Unit {
  return units.reduce((lowest, current) => {
    const currentMissing = current.maxHp - current.hp;
    const lowestMissing = lowest.maxHp - lowest.hp;
    return currentMissing > lowestMissing ? current : lowest;
  });
}

function hasRaidWiped(state: GameState): boolean {
  return state.units.every((unit) => unit.hp <= 0);
}

function selectUnitForMode(state: GameState, mode: GameMode): Unit {
  if (mode === "raidleader") {
    return getSelectedUnit(state);
  }

  const matchingUnit = state.units.find((unit) => unit.role === mode);

  if (!matchingUnit) {
    throw new Error(`No unit found for mode "${mode}".`);
  }

  return matchingUnit;
}

function resetCooldowns(state: GameState): void {
  state.cooldowns.melee = 0;
  state.cooldowns.ranged = 0;
  state.cooldowns.role = 0;
}

function getPrimaryAddTarget(state: GameState): EncounterAdd | null {
  if (state.adds.length === 0) {
    return null;
  }

  const selectedUnit = getSelectedUnit(state);
  const attackableAdds = state.adds.filter((add) => add.phase === selectedUnit.phase);

  if (attackableAdds.length === 0) {
    return null;
  }

  return [...attackableAdds].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "swarming_shade" ? -1 : 1;
    }

    return distanceBetween(selectedUnit.x, selectedUnit.y, left.x, left.y) -
      distanceBetween(selectedUnit.x, selectedUnit.y, right.x, right.y);
  })[0];
}

function dealDamageToBoss(state: GameState, amount: number, logText?: string): void {
  if (!state.boss.attackable) {
    return;
  }

  state.boss.hp = Math.max(0, state.boss.hp - amount);

  if (logText) {
    addLogEntry(state, logText, "damage");
  }
}

function dealDamageToAdd(state: GameState, add: EncounterAdd, amount: number, logText?: string): void {
  add.hp = Math.max(0, add.hp - amount);

  if (logText) {
    addLogEntry(state, logText, "damage");
  }

  if (add.phase === "rift" && add.hp > 0 && add.hp <= add.maxHp * 0.5) {
    add.phase = "material";
    add.targetTankId = null;
    addLogEntry(state, `${add.name} breaks through at 50% and spills back into Kimärus's phase.`, "utility");
  }

  if (add.hp <= 0) {
    addLogEntry(state, `${add.name} dies before it can reach Kimärus.`, "utility");
  }
}

function createAdd(kind: AddKind, x: number, y: number, phase: PhaseLayer, targetTankId: string | null): EncounterAdd {
  if (kind === "colossal_horror") {
    return {
      id: crypto.randomUUID(),
      kind,
      name: "Colossal Horror",
      phase,
      targetTankId,
      x,
      y,
      radius: 26,
      speed: 24,
      hp: 180,
      maxHp: 180,
      color: "#8f7cbb",
    };
  }

  return {
    id: crypto.randomUUID(),
    kind,
    name: "Swarming Shade",
    phase,
    targetTankId,
    x,
    y,
    radius: 14,
    speed: 58,
    hp: 56,
    maxHp: 56,
    color: "#7397d7",
  };
}

function tickAddMovement(state: GameState, add: EncounterAdd, deltaSeconds: number): void {
  if (add.phase === "rift") {
    const tankTarget = getTankTargetForAdd(state, add);

    if (!tankTarget) {
      if (DEBUG_ENCOUNTER) {
        debugEncounter(`rift add has no target: ${add.name} targetTank=${add.targetTankId ?? "none"}`);
      }
      return;
    }

    moveAddTowardPoint(add, tankTarget.x, tankTarget.y, deltaSeconds);
    return;
  }

  if (!state.boss.attackable) {
    return;
  }

  moveAddTowardBoss(state.boss, add, deltaSeconds);
}

function addAggro(state: GameState, unitId: string, amount: number): void {
  state.aggro[unitId] = (state.aggro[unitId] ?? 0) + amount;
}

function seedAggroAfterDive(state: GameState): void {
  for (const unit of state.units) {
    const baseline =
      unit.role === "tank" ? (unit.id === "tank-1" ? 140 : 110) : unit.role === "damage" ? 36 : 24;
    state.aggro[unit.id] = Math.max(state.aggro[unit.id] ?? 0, baseline);
  }
}

function getBossTargetUnit(state: GameState): Unit | null {
  if (!state.boss.targetUnitId) {
    return null;
  }

  return state.units.find((unit) => unit.id === state.boss.targetUnitId && unit.hp > 0) ?? null;
}

function getLivingTanks(state: GameState, phase?: PhaseLayer): Unit[] {
  return state.units.filter((unit) => unit.role === "tank" && unit.hp > 0 && (phase ? unit.phase === phase : true));
}

function handOffBossAggroToOtherTank(state: GameState, currentTankId: string): void {
  const currentTank = state.units.find((unit) => unit.id === currentTankId && unit.role === "tank");
  const otherTank = state.units.find(
    (unit) => unit.id !== currentTankId && unit.role === "tank" && unit.hp > 0 && unit.phase === "material",
  );

  if (!otherTank) {
    return;
  }

  if (currentTank) {
    currentTank.phase = "rift";
    state.aggro[currentTank.id] = Math.max(0, (state.aggro[currentTank.id] ?? 0) - 120);
  }

  state.aggro[otherTank.id] = Math.max(state.aggro[otherTank.id] ?? 0, 220);
  state.boss.targetUnitId = otherTank.id;
}

function getTankTargetForAdd(state: GameState, add: EncounterAdd): Unit | null {
  if (add.targetTankId) {
    const pinnedTank = state.units.find(
      (unit) => unit.id === add.targetTankId && unit.role === "tank" && unit.hp > 0 && unit.phase === add.phase,
    );

    if (pinnedTank) {
      return pinnedTank;
    }
  }

  return getLivingTanks(state, add.phase)[0] ?? null;
}

function releaseRaidFromRift(state: GameState): void {
  const strandedUnits = state.units.filter((unit) => unit.phase === "rift");

  if (strandedUnits.length === 0) {
    return;
  }

  for (const unit of strandedUnits) {
    unit.phase = "material";
  }

  addLogEntry(
    state,
    `${strandedUnits.map((unit) => unit.name).join(", ")} return from the Rift as the last manifestation breaks through.`,
    "utility",
  );
}

function moveBossTowardUnit(boss: Boss, unit: Unit, desiredDistance: number, deltaSeconds: number): void {
  const dx = unit.x - boss.x;
  const dy = unit.y - boss.y;
  const distance = Math.hypot(dx, dy) || 1;

  if (distance <= desiredDistance) {
    return;
  }

  const travelDistance = Math.min(distance - desiredDistance, boss.speed * deltaSeconds);
  boss.x += (dx / distance) * travelDistance;
  boss.y += (dy / distance) * travelDistance;
}

function moveBossTowardPoint(boss: Boss, x: number, y: number, deltaSeconds: number): void {
  const dx = x - boss.x;
  const dy = y - boss.y;
  const distance = Math.hypot(dx, dy) || 1;

  if (distance <= 4) {
    boss.x = x;
    boss.y = y;
    return;
  }

  const travelDistance = Math.min(distance, boss.speed * deltaSeconds);
  boss.x += (dx / distance) * travelDistance;
  boss.y += (dy / distance) * travelDistance;
}

function moveAddTowardBoss(boss: Boss, add: EncounterAdd, deltaSeconds: number): void {
  const dx = boss.x - add.x;
  const dy = boss.y - add.y;
  const distance = Math.hypot(dx, dy) || 1;
  add.x += (dx / distance) * add.speed * deltaSeconds;
  add.y += (dy / distance) * add.speed * deltaSeconds;
}

function moveAddTowardPoint(add: EncounterAdd, x: number, y: number, deltaSeconds: number): void {
  const dx = x - add.x;
  const dy = y - add.y;
  const distance = Math.hypot(dx, dy) || 1;
  const moveSpeed = add.phase === "rift" ? add.speed * 1.35 : add.speed;
  add.x += (dx / distance) * moveSpeed * deltaSeconds;
  add.y += (dy / distance) * moveSpeed * deltaSeconds;
}

function hasAddReachedBoss(add: EncounterAdd, boss: Boss): boolean {
  return distanceBetween(add.x, add.y, boss.x, boss.y) <= boss.radius + add.radius + 8;
}

function isInRange(unit: Unit, boss: Boss, extraRange: number): boolean {
  return distanceBetween(unit.x, unit.y, boss.x, boss.y) <= boss.radius + unit.radius + extraRange;
}

function isInAddRange(unit: Unit, add: EncounterAdd, extraRange: number): boolean {
  return distanceBetween(unit.x, unit.y, add.x, add.y) <= add.radius + unit.radius + extraRange;
}

function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function isInsideCircle(unit: Unit, x: number, y: number, radius: number): boolean {
  return distanceBetween(unit.x, unit.y, x, y) <= radius + unit.radius * 0.5;
}

function isInsideLine(
  unit: Unit,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
): boolean {
  const translatedX = unit.x - x;
  const translatedY = unit.y - y;
  const rotatedX = translatedX * Math.cos(-angle) - translatedY * Math.sin(-angle);
  const rotatedY = translatedX * Math.sin(-angle) + translatedY * Math.cos(-angle);

  return Math.abs(rotatedX - width / 2) <= width / 2 + unit.radius * 0.25 &&
    Math.abs(rotatedY) <= height / 2 + unit.radius * 0.25;
}

function pickIntermissionLane(state: GameState): number {
  const sequence = (state.spellCastCounts.corrupted_devastation ?? 0) % 3;

  if (sequence === 0) {
    return 210;
  }

  if (sequence === 1) {
    return 360;
  }

  return 510;
}

function addLogEntry(
  state: GameState,
  text: string,
  emphasis: CombatLogEntry["emphasis"] = "utility",
): void {
  state.logEntries = [
    {
      id: crypto.randomUUID(),
      text,
      emphasis,
    },
    ...state.logEntries,
  ].slice(0, MAX_LOG_ENTRIES);
}

function debugEncounter(message: string): void {
  console.log(`[Dreamrift Debug] ${message}`);
}

function getRoleLabel(role: Role): string {
  if (role === "damage") {
    return "Damage Dealer";
  }

  if (role === "tank") {
    return "Tank";
  }

  return "Healer";
}

function getRoleActionName(role: Role): string {
  return getRoleAction(role).name;
}

function getRoleAction(role: Role): { name: string; description: string; cooldown: number } {
  if (role === "tank") {
    return {
      name: "Guard Slam",
      description: "Extra control and damage into adds, with a small self-heal.",
      cooldown: 7,
    };
  }

  if (role === "healer") {
    return {
      name: "Verdant Mend",
      description: "Smart-heal the ally missing the most health.",
      cooldown: 4.5,
    };
  }

  return {
    name: "Dreamburst",
    description: "High burst damage into adds or the boss.",
    cooldown: 5.5,
  };
}

function getSpellPriority(spellId: SpellId): number {
  if (spellId === "rift_emergence") {
    return 9;
  }

  if (spellId === "consume" || spellId === "ravenous_dive") {
    return 10;
  }

  if (spellId === "corrupted_devastation") {
    return 8;
  }

  for (const phaseConfig of Object.values(chimaerusConfig.phases)) {
    const foundSpell = phaseConfig.spells.find((spell) => spell.id === spellId);

    if (foundSpell) {
      return foundSpell.priority;
    }
  }

  throw new Error(`Spell config "${spellId}" was not found.`);
}
