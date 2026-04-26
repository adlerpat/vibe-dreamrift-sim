import { CORRUPTED_DEVASTATION } from "../../data/actors/bosses/kimarus/spells/corruptedDevastation";
import type { EncounterAdd, GameState } from "../state/types";
import { moveAddTowardBoss, moveAddTowardPoint } from "./geometry";
import { addLogEntry, debugEncounter } from "./logging";
import { getTankTargetForAdd } from "./targeting";

export function tickAddMovement(state: GameState, add: EncounterAdd, deltaSeconds: number): void {
  if (add.phase === "rift") {
    const tankTarget = getTankTargetForAdd(state, add);

    if (!tankTarget) {
      debugEncounter(`rift add has no target: ${add.name} targetTank=${add.targetTankId ?? "none"}`);
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

export function releaseRaidFromRift(state: GameState): void {
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

export function pickIntermissionLane(state: GameState): number {
  const sequence = (state.spellCastCounts.corrupted_devastation ?? 0) % CORRUPTED_DEVASTATION.laneSequence.length;
  return CORRUPTED_DEVASTATION.laneSequence[sequence];
}
