import { COLOSSAL_HORROR } from "../../data/actors/adds/colossal-horror";
import { SWARMING_SHADE } from "../../data/actors/adds/swarming-shade";
import type { AddKind, EncounterAdd, PhaseLayer, Role, Unit } from "../state/types";

export function createPlayerUnit(
  unit: { id: string; name: string; x: number; y: number; color: string },
  archetype: { role: Role; radius: number; speed: number; hp: number; maxHp: number },
): Unit {
  return {
    id: unit.id,
    name: unit.name,
    role: archetype.role,
    phase: "material",
    x: unit.x,
    y: unit.y,
    radius: archetype.radius,
    speed: archetype.speed,
    color: unit.color,
    hp: archetype.hp,
    maxHp: archetype.maxHp,
    pendingRecoverySeconds: 0,
  };
}

export function createAdd(
  kind: AddKind,
  x: number,
  y: number,
  phase: PhaseLayer,
  targetTankId: string | null,
): EncounterAdd {
  if (kind === "colossal_horror") {
    return {
      id: crypto.randomUUID(),
      kind,
      name: COLOSSAL_HORROR.name,
      phase,
      targetTankId,
      x,
      y,
      radius: COLOSSAL_HORROR.radius,
      speed: COLOSSAL_HORROR.speed,
      hp: COLOSSAL_HORROR.hp,
      maxHp: COLOSSAL_HORROR.maxHp,
      color: COLOSSAL_HORROR.color,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind,
    name: SWARMING_SHADE.name,
    phase,
    targetTankId,
    x,
    y,
    radius: SWARMING_SHADE.radius,
    speed: SWARMING_SHADE.speed,
    hp: SWARMING_SHADE.hp,
    maxHp: SWARMING_SHADE.maxHp,
    color: SWARMING_SHADE.color,
  };
}
