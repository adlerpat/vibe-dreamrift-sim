import {
  chimaerusConfig,
  type ScheduledSpellConfig,
  type SpellId,
} from "../../data/bosses/chimaerus";
import { KIMARUS_BOSS } from "../../data/actors/bosses/kimarus";
import { ALNDUST_UPHEAVAL } from "../../data/actors/bosses/kimarus/spells/alndustUpheaval";
import { CONSUME } from "../../data/actors/bosses/kimarus/spells/consume";
import { CORRUPTED_DEVASTATION } from "../../data/actors/bosses/kimarus/spells/corruptedDevastation";
import { RAVENOUS_DIVE } from "../../data/actors/bosses/kimarus/spells/ravenousDive";
import { RENDING_TEAR } from "../../data/actors/bosses/kimarus/spells/rendingTear";
import { RIFT_EMERGENCE } from "../../data/actors/bosses/kimarus/spells/riftEmergence";
import { COMMON_PLAYER_ABILITIES, SUPPORT_RAID_DAMAGE } from "../../data/actors/players/common";
import { DAMAGE_ROLE_ABILITY } from "../../data/actors/players/damage";
import { HEALER_ROLE_ABILITY } from "../../data/actors/players/healer";
import { TANK_ROLE_ABILITY } from "../../data/actors/players/tank";
import { createAdd } from "../encounter/factories";
import {
  hasAddReachedBoss,
  isInAddRange,
  isInRange,
  isInsideCircle,
  isInsideLine,
  moveBossTowardPoint,
  moveBossTowardUnit,
} from "../encounter/geometry";
import { pickIntermissionLane, releaseRaidFromRift, tickAddMovement } from "../encounter/adds";
import { addLogEntry, debugEncounter } from "../encounter/logging";
import { getRoleActionName } from "../encounter/roles";
import { resetCooldowns, selectUnitForMode } from "../encounter/selection";
import {
  addAggro,
  getBossTargetUnit,
  getLivingTanks,
  getLowestHealthUnit,
  getPrimaryAddTarget,
  handOffBossAggroToOtherTank,
  hasRaidWiped,
  seedAggroAfterDive,
} from "../encounter/targeting";
import { createInitialState } from "./initialState";
import { getHudSnapshot } from "./hud";
import { getSelectedUnit, getSelectionSummary } from "./selectors";
import type {
  AbilityId,
  ActiveSpell,
  EncounterAdd,
  GameMode,
  GameState,
  QueuedSpell,
  SelectionSummary,
  Unit,
} from "./types";

export { createInitialState, getHudSnapshot, getSelectedUnit, getSelectionSummary };
export type * from "./types";

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
  const addTarget = getPrimaryAddTarget(state, unit);

  if (abilityId === "melee") {
    if (addTarget) {
      if (!isInAddRange(unit, addTarget, COMMON_PLAYER_ABILITIES.melee.addRange)) {
        addLogEntry(state, `${unit.name} is too far away to strike ${addTarget.name}.`, "utility");
        return false;
      }

      dealDamageToAdd(state, addTarget, 42, `${unit.name} cleaves ${addTarget.name} for 42 damage.`);
      addAggro(state, unit.id, COMMON_PLAYER_ABILITIES.melee.addAggro);
      state.cooldowns.melee = COMMON_PLAYER_ABILITIES.melee.cooldown;
      return true;
    }

    if (
      !state.boss.attackable ||
      unit.phase !== state.boss.phase ||
      !isInRange(unit, state.boss, COMMON_PLAYER_ABILITIES.melee.range)
    ) {
      addLogEntry(state, `${unit.name} is too far away to land a melee strike.`, "utility");
      return false;
    }

    dealDamageToBoss(state, COMMON_PLAYER_ABILITIES.melee.damage, `${unit.name} slashes Kimärus for ${COMMON_PLAYER_ABILITIES.melee.damage} damage.`);
    addAggro(state, unit.id, COMMON_PLAYER_ABILITIES.melee.bossAggro);
    state.cooldowns.melee = COMMON_PLAYER_ABILITIES.melee.cooldown;
    return true;
  }

  if (abilityId === "ranged") {
    if (addTarget) {
      dealDamageToAdd(state, addTarget, COMMON_PLAYER_ABILITIES.ranged.damage, `${unit.name} shoots ${addTarget.name} for ${COMMON_PLAYER_ABILITIES.ranged.damage} damage.`);
      addAggro(state, unit.id, COMMON_PLAYER_ABILITIES.ranged.addAggro);
      state.cooldowns.ranged = COMMON_PLAYER_ABILITIES.ranged.cooldown;
      return true;
    }

    if (!state.boss.attackable || unit.phase !== state.boss.phase) {
      addLogEntry(state, "Kimärus is not attackable right now.", "utility");
      return false;
    }

    dealDamageToBoss(state, COMMON_PLAYER_ABILITIES.ranged.damage, `${unit.name} lands a ranged hit on Kimärus for ${COMMON_PLAYER_ABILITIES.ranged.damage} damage.`);
    addAggro(state, unit.id, COMMON_PLAYER_ABILITIES.ranged.bossAggro);
    state.cooldowns.ranged = COMMON_PLAYER_ABILITIES.ranged.cooldown;
    return true;
  }

  return useRoleAbility(state, unit);
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
    moveBossTowardPoint(state.boss, KIMARUS_BOSS.intermissionRetreat.x, KIMARUS_BOSS.intermissionRetreat.y, deltaSeconds);
    return;
  }

  const targetUnit = getBossTargetUnit(state);

  if (!targetUnit) {
    moveBossTowardPoint(state.boss, KIMARUS_BOSS.idleAnchor.x, KIMARUS_BOSS.idleAnchor.y, deltaSeconds);
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
    debugEncounter(
      `consume waiting: active=${state.activeSpell?.spellId ?? "none"} queue=${state.spellQueue.map((spell) => spell.spellId).join(",") || "empty"}`,
    );
    return;
  }

  queueSpellById(state, "consume", "follow_up");
  state.pendingConsumeAfterRift = false;
  debugEncounter(`consume queued at ${state.encounterTime.toFixed(1)}s`);
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

  debugEncounter(`queued ${spellId} via ${source}`);
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

  debugEncounter(`start ${nextSpell.spellId}`);

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
      label: ALNDUST_UPHEAVAL.label,
      timeRemaining: ALNDUST_UPHEAVAL.castTime,
      totalDuration: ALNDUST_UPHEAVAL.castTime,
      payload: {
        targetTankId: bossTargetUnit.id,
      },
      telegraph: {
        id: crypto.randomUUID(),
        label: ALNDUST_UPHEAVAL.label,
        shape: "circle",
        x: bossTargetUnit.x,
        y: bossTargetUnit.y,
        radius: ALNDUST_UPHEAVAL.telegraphRadius,
        timeRemaining: ALNDUST_UPHEAVAL.castTime,
        totalDuration: ALNDUST_UPHEAVAL.castTime,
      },
    };
  }

  if (spellId === "rending_tear") {
    const dx = bossTargetUnit.x - state.boss.x;
    const dy = bossTargetUnit.y - state.boss.y;

    return {
      spellId,
      label: RENDING_TEAR.label,
      timeRemaining: RENDING_TEAR.castTime,
      totalDuration: RENDING_TEAR.castTime,
      telegraph: {
        id: crypto.randomUUID(),
        label: RENDING_TEAR.label,
        shape: "line",
        x: state.boss.x,
        y: state.boss.y,
        width: Math.hypot(dx, dy),
        height: RENDING_TEAR.telegraphHeight,
        angle: Math.atan2(dy, dx),
        timeRemaining: RENDING_TEAR.castTime,
        totalDuration: RENDING_TEAR.castTime,
      },
    };
  }

  if (spellId === "consume") {
    return {
      spellId,
      label: CONSUME.label,
      timeRemaining: CONSUME.castTime,
      totalDuration: CONSUME.castTime,
      telegraph: null,
    };
  }

  if (spellId === "corrupted_devastation") {
    const lane = pickIntermissionLane(state);

    return {
      spellId,
      label: CORRUPTED_DEVASTATION.label,
      timeRemaining: CORRUPTED_DEVASTATION.castTime,
      totalDuration: CORRUPTED_DEVASTATION.castTime,
      telegraph: {
        id: crypto.randomUUID(),
        label: CORRUPTED_DEVASTATION.label,
        shape: "line",
        x: KIMARUS_BOSS.spawn.x,
        y: lane,
        width: CORRUPTED_DEVASTATION.width,
        height: CORRUPTED_DEVASTATION.height,
        angle: 0,
        timeRemaining: CORRUPTED_DEVASTATION.castTime,
        totalDuration: CORRUPTED_DEVASTATION.castTime,
      },
    };
  }

  if (spellId === "ravenous_dive") {
    return {
      spellId,
      label: RAVENOUS_DIVE.label,
      timeRemaining: RAVENOUS_DIVE.castTime,
      totalDuration: RAVENOUS_DIVE.castTime,
      telegraph: {
        id: crypto.randomUUID(),
        label: RAVENOUS_DIVE.label,
        shape: "circle",
        x: state.boss.x,
        y: state.boss.y,
        radius: RAVENOUS_DIVE.telegraphRadius,
        timeRemaining: RAVENOUS_DIVE.castTime,
        totalDuration: RAVENOUS_DIVE.castTime,
      },
    };
  }

  return {
    spellId,
    label: RIFT_EMERGENCE.label,
    timeRemaining: RIFT_EMERGENCE.castTime,
    totalDuration: RIFT_EMERGENCE.castTime,
    telegraph: null,
  };
}

function resolveSpell(state: GameState, activeSpell: ActiveSpell): void {
  state.spellCastCounts[activeSpell.spellId] = (state.spellCastCounts[activeSpell.spellId] ?? 0) + 1;

  debugEncounter(`resolve ${activeSpell.spellId}`);

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
    state.consumeDelay = ALNDUST_UPHEAVAL.consumeDelayAfterSoak;
    addLogEntry(state, "Consume is primed and will resolve in 15 seconds.", "utility");

    debugEncounter(
      `upheaval soaked: tank=${targetTankId ?? "none"} soakers=${soakingUnits.map((unit) => unit.name).join(",")} consume=${state.pendingConsumeAfterRift ? `${state.consumeDelay}s` : "no"}`,
    );

    addLogEntry(state, `Alndust Upheaval is soaked by ${soakingUnits.map((unit) => unit.name).join(", ")}.`, "utility");
    return;
  }

  for (const unit of state.units) {
    applyDamageToUnit(state, unit, ALNDUST_UPHEAVAL.failureDamage);
  }

  debugEncounter(
    `upheaval failed: tank=${targetTankId ?? "none"} soakers=${soakingUnits.map((unit) => unit.name).join(",") || "none"}`,
  );

  addLogEntry(state, "Alndust Upheaval was under-soaked and rocks the raid.", "damage");
}

function spawnRiftAdds(state: GameState): void {
  const targetTankId = state.lastAlndustTankId;
  state.adds.push(
    ...RIFT_EMERGENCE.spawnPoints.map((spawnPoint) =>
      createAdd(spawnPoint.kind, spawnPoint.x, spawnPoint.y, "rift", targetTankId),
    ),
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

  debugEncounter(`rift adds spawned for tank=${targetTankId ?? "none"}`);
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
    applyDamageToUnit(state, unit, RENDING_TEAR.damage);
  }

  addLogEntry(state, `Rending Tear slices through ${hitUnits.map((unit) => unit.name).join(", ")}.`, "damage");
}

function resolveConsume(state: GameState): void {
  const addCount = state.adds.length;

  debugEncounter(`consume resolve: addsAlive=${addCount} at ${state.encounterTime.toFixed(1)}s`);

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

  debugEncounter("consume cast began: raid and adds returned to boss phase");
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
    createAdd(
      "swarming_shade",
      CORRUPTED_DEVASTATION.spawnPoints.leftXMin + Math.random() * CORRUPTED_DEVASTATION.spawnPoints.leftXRange,
      telegraph.y - CORRUPTED_DEVASTATION.spawnPoints.yOffset,
      "material",
      null,
    ),
    createAdd(
      "swarming_shade",
      CORRUPTED_DEVASTATION.spawnPoints.rightXMax - Math.random() * CORRUPTED_DEVASTATION.spawnPoints.rightXRange,
      telegraph.y + CORRUPTED_DEVASTATION.spawnPoints.yOffset,
      "material",
      null,
    ),
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
  state.boss.x = KIMARUS_BOSS.reentry.x;
  state.boss.y = KIMARUS_BOSS.reentry.y;
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
  if (state.raidAutoAttackTimer < SUPPORT_RAID_DAMAGE.tickInterval) {
    return;
  }

  state.raidAutoAttackTimer = 0;

  const selectedUnit = getSelectedUnit(state);
  const supportingRaid = state.units.filter((unit) => unit.id !== selectedUnit.id);
  const targetAdd = getPrimaryAddTarget(state, selectedUnit);

  if (targetAdd) {
    let totalDamage = 0;

    for (const unit of supportingRaid) {
      if (unit.phase !== targetAdd.phase) {
        continue;
      }

      totalDamage += unit.role === "healer"
        ? SUPPORT_RAID_DAMAGE.add.healer
        : unit.role === "tank"
          ? SUPPORT_RAID_DAMAGE.add.tank
          : SUPPORT_RAID_DAMAGE.add.damage;
      addAggro(
        state,
        unit.id,
        unit.role === "healer"
          ? SUPPORT_RAID_DAMAGE.aggro.add.healer
          : unit.role === "tank"
            ? SUPPORT_RAID_DAMAGE.aggro.add.tank
            : SUPPORT_RAID_DAMAGE.aggro.add.damage,
      );
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

    totalDamage += unit.role === "healer"
      ? SUPPORT_RAID_DAMAGE.boss.healer
      : unit.role === "tank"
        ? SUPPORT_RAID_DAMAGE.boss.tank
        : SUPPORT_RAID_DAMAGE.boss.damage;
    addAggro(
      state,
      unit.id,
      unit.role === "healer"
        ? SUPPORT_RAID_DAMAGE.aggro.boss.healer
        : unit.role === "tank"
          ? SUPPORT_RAID_DAMAGE.aggro.boss.tank
          : SUPPORT_RAID_DAMAGE.aggro.boss.damage,
    );
  }

  dealDamageToBoss(state, totalDamage);
}

function useRoleAbility(state: GameState, unit: Unit): boolean {
  const addTarget = getPrimaryAddTarget(state, unit);

  if (unit.role === "tank") {
    state.cooldowns.role = TANK_ROLE_ABILITY.cooldown;

    if (addTarget) {
      dealDamageToAdd(state, addTarget, TANK_ROLE_ABILITY.addDamage, `${unit.name} slams ${addTarget.name} and braces for impact.`);
      addAggro(state, unit.id, TANK_ROLE_ABILITY.addAggro);
    } else if (state.boss.attackable && unit.phase === state.boss.phase) {
      dealDamageToBoss(state, TANK_ROLE_ABILITY.bossDamage, `${unit.name} uses Guard Slam on Kimärus.`);
      addAggro(state, unit.id, TANK_ROLE_ABILITY.bossAggro);
    }

    unit.hp = Math.min(unit.maxHp, unit.hp + TANK_ROLE_ABILITY.selfHeal);
    return true;
  }

  if (unit.role === "healer") {
    const target = getLowestHealthUnit(state.units);
    const healedFor = Math.min(HEALER_ROLE_ABILITY.healAmount, target.maxHp - target.hp);

    if (healedFor <= 0) {
      addLogEntry(state, `${unit.name} finds no urgent healing target.`, "utility");
      return false;
    }

    target.hp += healedFor;
    state.cooldowns.role = HEALER_ROLE_ABILITY.cooldown;
    addAggro(state, unit.id, HEALER_ROLE_ABILITY.aggro);
    addLogEntry(state, `${unit.name} restores ${healedFor} health to ${target.name}.`, "heal");
    return true;
  }

  state.cooldowns.role = DAMAGE_ROLE_ABILITY.cooldown;

  if (addTarget) {
    dealDamageToAdd(state, addTarget, DAMAGE_ROLE_ABILITY.damage, `${unit.name} unloads Dreamburst into ${addTarget.name}.`);
    addAggro(state, unit.id, DAMAGE_ROLE_ABILITY.addAggro);
  } else if (state.boss.attackable && unit.phase === state.boss.phase) {
    dealDamageToBoss(state, DAMAGE_ROLE_ABILITY.damage, `${unit.name} unleashes Dreamburst on Kimärus.`);
    addAggro(state, unit.id, DAMAGE_ROLE_ABILITY.bossAggro);
  }

  return true;
}

function applyInsatiable(state: GameState, stackCount: number, text: string): void {
  state.boss.damageBoostStacks += stackCount;

  const raidDamage = KIMARUS_BOSS.consumeDamagePerAdd * stackCount;

  for (const unit of state.units) {
    applyDamageToUnit(state, unit, raidDamage);
  }

  const missingHealth = state.boss.maxHp - state.boss.hp;
  const healAmount = Math.min(missingHealth, KIMARUS_BOSS.insatiableBossHealPerAdd * stackCount);
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
