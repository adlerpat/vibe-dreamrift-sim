import { COMMON_PLAYER_ABILITIES } from "../../data/actors/players/common";
import { getRoleAction, getRoleLabel } from "../encounter/roles";
import { getSelectedUnit } from "./selectors";
import type { GameState, HudSnapshot } from "./types";

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
        name: COMMON_PLAYER_ABILITIES.melee.name,
        description: COMMON_PLAYER_ABILITIES.melee.description,
        cooldownRemaining: state.cooldowns.melee,
        cooldownDuration: COMMON_PLAYER_ABILITIES.melee.cooldown,
        ready: state.cooldowns.melee <= 0,
      },
      {
        id: "ranged",
        slotLabel: "2",
        name: COMMON_PLAYER_ABILITIES.ranged.name,
        description: COMMON_PLAYER_ABILITIES.ranged.description,
        cooldownRemaining: state.cooldowns.ranged,
        cooldownDuration: COMMON_PLAYER_ABILITIES.ranged.cooldown,
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
