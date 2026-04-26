import { getRoleLabel } from "../encounter/roles";
import type { GameState, SelectionSummary, Unit } from "./types";

export function getSelectedUnit(state: GameState): Unit {
  const selectedUnit = state.units.find((unit) => unit.id === state.selectedUnitId);

  if (!selectedUnit) {
    throw new Error(`Selected unit "${state.selectedUnitId}" was not found.`);
  }

  return selectedUnit;
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
