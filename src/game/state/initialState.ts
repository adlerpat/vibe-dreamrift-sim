import { KIMARUS_BOSS } from "../../data/actors/bosses/kimarus";
import { DAMAGE_ARCHETYPE, DAMAGE_UNITS } from "../../data/actors/players/damage";
import { HEALER_ARCHETYPE, HEALER_UNITS } from "../../data/actors/players/healer";
import { TANK_ARCHETYPE, TANK_UNITS } from "../../data/actors/players/tank";
import { createPlayerUnit } from "../encounter/factories";
import type { GameState, Unit } from "./types";

export function createInitialState(): GameState {
  const units: Unit[] = [
    ...TANK_UNITS.map((unit) => createPlayerUnit(unit, TANK_ARCHETYPE)),
    ...DAMAGE_UNITS.map((unit) => createPlayerUnit(unit, DAMAGE_ARCHETYPE)),
    ...HEALER_UNITS.map((unit) => createPlayerUnit(unit, HEALER_ARCHETYPE)),
  ];

  return {
    mode: "damage",
    selectedUnitId: "damage-1",
    units,
    boss: {
      name: KIMARUS_BOSS.name,
      x: KIMARUS_BOSS.spawn.x,
      y: KIMARUS_BOSS.spawn.y,
      radius: KIMARUS_BOSS.radius,
      speed: KIMARUS_BOSS.speed,
      phase: "material",
      hp: KIMARUS_BOSS.hp,
      maxHp: KIMARUS_BOSS.maxHp,
      energy: 0,
      visible: true,
      attackable: true,
      damageBoostStacks: 0,
      targetUnitId: KIMARUS_BOSS.startingTargetUnitId,
    },
    aggro: {
      "tank-1": TANK_ARCHETYPE.startingAggro.primary,
      "tank-2": TANK_ARCHETYPE.startingAggro.secondary,
      "damage-1": DAMAGE_ARCHETYPE.startingAggro,
      "damage-2": DAMAGE_ARCHETYPE.startingAggro,
      "healer-1": HEALER_ARCHETYPE.startingAggro,
      "healer-2": HEALER_ARCHETYPE.startingAggro,
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
