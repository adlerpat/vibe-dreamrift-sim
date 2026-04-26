import { KIMARUS_BOSS } from "../../data/actors/bosses/kimarus";
import type { EncounterAdd, GameState, PhaseLayer, Unit } from "../state/types";
import { distanceBetween } from "./geometry";

export function getLowestHealthUnit(units: Unit[]): Unit {
  return units.reduce((lowest, current) => {
    const currentMissing = current.maxHp - current.hp;
    const lowestMissing = lowest.maxHp - lowest.hp;
    return currentMissing > lowestMissing ? current : lowest;
  });
}

export function hasRaidWiped(state: GameState): boolean {
  return state.units.every((unit) => unit.hp <= 0);
}

export function getPrimaryAddTarget(state: GameState, selectedUnit: Unit): EncounterAdd | null {
  if (state.adds.length === 0) {
    return null;
  }

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

export function addAggro(state: GameState, unitId: string, amount: number): void {
  state.aggro[unitId] = (state.aggro[unitId] ?? 0) + amount;
}

export function seedAggroAfterDive(state: GameState): void {
  for (const unit of state.units) {
    const baseline = unit.role === "tank"
      ? unit.id === "tank-1"
        ? KIMARUS_BOSS.reengageAggro.tank1
        : KIMARUS_BOSS.reengageAggro.tank2
      : unit.role === "damage"
        ? KIMARUS_BOSS.reengageAggro.damage
        : KIMARUS_BOSS.reengageAggro.healer;
    state.aggro[unit.id] = Math.max(state.aggro[unit.id] ?? 0, baseline);
  }
}

export function getBossTargetUnit(state: GameState): Unit | null {
  if (!state.boss.targetUnitId) {
    return null;
  }

  return state.units.find((unit) => unit.id === state.boss.targetUnitId && unit.hp > 0) ?? null;
}

export function getLivingTanks(state: GameState, phase?: PhaseLayer): Unit[] {
  return state.units.filter((unit) => unit.role === "tank" && unit.hp > 0 && (phase ? unit.phase === phase : true));
}

export function handOffBossAggroToOtherTank(state: GameState, currentTankId: string): void {
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

export function getTankTargetForAdd(state: GameState, add: EncounterAdd): Unit | null {
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
