import type { Boss, EncounterAdd, Unit } from "../state/types";

export function moveBossTowardUnit(boss: Boss, unit: Unit, desiredDistance: number, deltaSeconds: number): void {
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

export function moveBossTowardPoint(boss: Boss, x: number, y: number, deltaSeconds: number): void {
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

export function moveAddTowardBoss(boss: Boss, add: EncounterAdd, deltaSeconds: number): void {
  const dx = boss.x - add.x;
  const dy = boss.y - add.y;
  const distance = Math.hypot(dx, dy) || 1;
  add.x += (dx / distance) * add.speed * deltaSeconds;
  add.y += (dy / distance) * add.speed * deltaSeconds;
}

export function moveAddTowardPoint(add: EncounterAdd, x: number, y: number, deltaSeconds: number): void {
  const dx = x - add.x;
  const dy = y - add.y;
  const distance = Math.hypot(dx, dy) || 1;
  const moveSpeed = add.phase === "rift" ? add.speed * 1.35 : add.speed;
  add.x += (dx / distance) * moveSpeed * deltaSeconds;
  add.y += (dy / distance) * moveSpeed * deltaSeconds;
}

export function hasAddReachedBoss(add: EncounterAdd, boss: Boss): boolean {
  return distanceBetween(add.x, add.y, boss.x, boss.y) <= boss.radius + add.radius + 8;
}

export function isInRange(unit: Unit, boss: Boss, extraRange: number): boolean {
  return distanceBetween(unit.x, unit.y, boss.x, boss.y) <= boss.radius + unit.radius + extraRange;
}

export function isInAddRange(unit: Unit, add: EncounterAdd, extraRange: number): boolean {
  return distanceBetween(unit.x, unit.y, add.x, add.y) <= add.radius + unit.radius + extraRange;
}

export function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export function isInsideCircle(unit: Unit, x: number, y: number, radius: number): boolean {
  return distanceBetween(unit.x, unit.y, x, y) <= radius + unit.radius * 0.5;
}

export function isInsideLine(
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
