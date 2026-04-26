import type { GameMode, GameState, Unit } from "../state/types";

export function selectUnitForMode(state: GameState, mode: GameMode): Unit {
  if (mode === "raidleader") {
    const selectedUnit = state.units.find((unit) => unit.id === state.selectedUnitId);

    if (!selectedUnit) {
      throw new Error(`Selected unit "${state.selectedUnitId}" was not found.`);
    }

    return selectedUnit;
  }

  const matchingUnit = state.units.find((unit) => unit.role === mode);

  if (!matchingUnit) {
    throw new Error(`No unit found for mode "${mode}".`);
  }

  return matchingUnit;
}

export function resetCooldowns(state: GameState): void {
  state.cooldowns.melee = 0;
  state.cooldowns.ranged = 0;
  state.cooldowns.role = 0;
}
