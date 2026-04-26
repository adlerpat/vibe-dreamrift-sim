import { DAMAGE_ROLE_ABILITY } from "../../data/actors/players/damage";
import { HEALER_ROLE_ABILITY } from "../../data/actors/players/healer";
import { TANK_ROLE_ABILITY } from "../../data/actors/players/tank";
import type { Role } from "../state/types";

export function getRoleLabel(role: Role): string {
  if (role === "damage") {
    return "Damage Dealer";
  }

  if (role === "tank") {
    return "Tank";
  }

  return "Healer";
}

export function getRoleActionName(role: Role): string {
  return getRoleAction(role).name;
}

export function getRoleAction(role: Role): { name: string; description: string; cooldown: number } {
  if (role === "tank") {
    return TANK_ROLE_ABILITY;
  }

  if (role === "healer") {
    return HEALER_ROLE_ABILITY;
  }

  return DAMAGE_ROLE_ABILITY;
}
