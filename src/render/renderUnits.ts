import chimaerusIdleUrl from "../sprites/chimaerus/chimaerus_idle.png";
import damageIdleUrl from "../sprites/dd/dd_idle.png";
import healIdleUrl from "../sprites/heal/heal_idle.png";
import tankIdleUrl from "../sprites/tank/tank_idle.png";
import type { Boss, EncounterAdd, Unit } from "../game/state/types";

const bossSprite = new Image();
bossSprite.src = chimaerusIdleUrl;

const roleSprites: Record<Unit["role"], HTMLImageElement> = {
  tank: createSprite(tankIdleUrl),
  damage: createSprite(damageIdleUrl),
  healer: createSprite(healIdleUrl),
};

type UnitRenderState = {
  units: Unit[];
  boss: Boss;
  adds: EncounterAdd[];
  selectedUnitId: string;
  selectedUnitPhase: Unit["phase"];
};

export function renderUnits(context: CanvasRenderingContext2D, state: UnitRenderState): void {
  drawBoss(context, state.boss, state.units);
  drawAdds(context, state.adds, state.selectedUnitPhase);

  for (const unit of state.units) {
    const isSelected = unit.id === state.selectedUnitId;
    drawUnit(context, unit, isSelected, state.boss, state.adds);
  }
}

function drawAdds(context: CanvasRenderingContext2D, adds: EncounterAdd[], selectedUnitPhase: Unit["phase"]): void {
  for (const add of adds) {
    const isAttackable = add.phase === selectedUnitPhase;
    context.globalAlpha = isAttackable ? 1 : 0.38;
    context.fillStyle = add.phase === "rift" ? "#65a6ff" : add.color;
    context.beginPath();
    context.arc(add.x, add.y, add.radius, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "rgba(235, 229, 216, 0.38)";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(add.x, add.y, add.radius, 0, Math.PI * 2);
    context.stroke();

    context.fillStyle = "rgba(248, 242, 232, 0.88)";
    context.font = "600 12px Trebuchet MS";
    context.textAlign = "center";
    context.fillText(
      `${add.kind === "colossal_horror" ? "Horror" : "Shade"}${add.phase === "rift" ? " • Rift" : ""}`,
      add.x,
      add.y - add.radius - 10,
    );

    drawBar(context, {
      x: add.x - 24,
      y: add.y + add.radius + 7,
      width: 48,
      height: 6,
      current: add.hp,
      max: add.maxHp,
      fill: add.phase === "rift" ? "#70b6ff" : add.kind === "colossal_horror" ? "#b28bda" : "#7ea7e8",
      background: "rgba(11, 18, 24, 0.74)",
      stroke: "rgba(252, 247, 238, 0.12)",
    });

    context.globalAlpha = 1;
  }
}

function drawBoss(context: CanvasRenderingContext2D, boss: Boss, units: Unit[]): void {
  context.fillStyle = "rgba(143, 50, 74, 0.16)";
  context.beginPath();
  context.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
  context.fill();

  if (bossSprite.complete) {
    const targetUnit = units.find((unit) => unit.id === boss.targetUnitId) ?? null;
    const facingLeft = targetUnit ? targetUnit.x < boss.x : false;
    const spriteScale = 3.15;
    const spriteWidth = boss.radius * spriteScale;
    const spriteHeight = spriteWidth * (bossSprite.naturalHeight / bossSprite.naturalWidth);
    const spriteY = boss.y + boss.radius - spriteHeight;

    context.save();
    if (facingLeft) {
      context.translate(boss.x, 0);
      context.scale(-1, 1);
      context.drawImage(bossSprite, -spriteWidth / 2, spriteY, spriteWidth, spriteHeight);
    } else {
      context.drawImage(bossSprite, boss.x - spriteWidth / 2, spriteY, spriteWidth, spriteHeight);
    }
    context.restore();
  } else {
    context.fillStyle = "#8f324a";
    context.beginPath();
    context.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
    context.fill();
  }

  context.strokeStyle = boss.attackable ? "rgba(255, 219, 226, 0.52)" : "rgba(199, 205, 218, 0.34)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
  context.stroke();

  drawBar(context, {
    x: boss.x - 70,
    y: boss.y - boss.radius - 26,
    width: 140,
    height: 10,
    current: boss.hp,
    max: boss.maxHp,
    fill: "#d8617e",
    background: "rgba(16, 23, 31, 0.8)",
    stroke: "rgba(255, 232, 236, 0.28)",
  });
}

function drawUnit(
  context: CanvasRenderingContext2D,
  unit: Unit,
  isSelected: boolean,
  boss: Boss,
  adds: EncounterAdd[],
): void {
  if (isSelected) {
    context.strokeStyle = "rgba(255, 241, 184, 0.85)";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(unit.x, unit.y, unit.radius + 8, 0, Math.PI * 2);
    context.stroke();
  }

  const sprite = roleSprites[unit.role];

  context.strokeStyle = "rgba(243, 237, 226, 0.48)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(unit.x, unit.y, unit.radius, 0, Math.PI * 2);
  context.stroke();

  if (sprite.complete) {
    const spriteWidth = unit.radius * 3;
    const spriteHeight = spriteWidth * (sprite.naturalHeight / sprite.naturalWidth);
    const spriteX = unit.x - spriteWidth / 2;
    const spriteY = unit.y + unit.radius - spriteHeight;

    context.drawImage(sprite, spriteX, spriteY, spriteWidth, spriteHeight);
  } else {
    context.fillStyle = unit.color;
    context.beginPath();
    context.arc(unit.x, unit.y, unit.radius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#091118";
    context.font = "700 12px Trebuchet MS";
    context.textAlign = "center";
    context.fillText(getRoleShortLabel(unit.role), unit.x, unit.y + 4);
  }

  context.fillStyle = "rgba(255, 247, 234, 0.9)";
  context.font = isSelected ? "700 14px Trebuchet MS" : "500 13px Trebuchet MS";
  context.fillText(unit.name, unit.x, unit.y - unit.radius - 12);

  const facingTarget = getUnitFacingTarget(unit, boss, adds);
  if (facingTarget) {
    drawFacingArrow(context, unit, facingTarget.x, facingTarget.y);
  }

  drawBar(context, {
    x: unit.x - 24,
    y: unit.y + unit.radius + 8,
    width: 48,
    height: 6,
    current: unit.hp,
    max: unit.maxHp,
    fill: unit.role === "healer" ? "#8fdc8c" : "#d4b26a",
    background: "rgba(11, 18, 24, 0.74)",
    stroke: "rgba(252, 247, 238, 0.12)",
  });
}

function getRoleShortLabel(role: Unit["role"]): string {
  if (role === "tank") {
    return "T";
  }

  if (role === "damage") {
    return "D";
  }

  return "H";
}

function createSprite(source: string): HTMLImageElement {
  const image = new Image();
  image.src = source;
  return image;
}

function getUnitFacingTarget(
  unit: Unit,
  boss: Boss,
  adds: EncounterAdd[],
): { x: number; y: number } | null {
  const attackableAdds = adds.filter((add) => add.phase === unit.phase);

  if (attackableAdds.length > 0) {
    const nearestAdd = attackableAdds.reduce((nearest, current) =>
      getDistanceSquared(unit.x, unit.y, current.x, current.y) <
        getDistanceSquared(unit.x, unit.y, nearest.x, nearest.y)
        ? current
        : nearest
    );

    return { x: nearestAdd.x, y: nearestAdd.y };
  }

  if (boss.attackable && boss.phase === unit.phase) {
    return { x: boss.x, y: boss.y };
  }

  return null;
}

function drawFacingArrow(context: CanvasRenderingContext2D, unit: Unit, targetX: number, targetY: number): void {
  const angle = Math.atan2(targetY - unit.y, targetX - unit.x);
  const orbitRadius = unit.radius + 12;
  const arrowX = unit.x + Math.cos(angle) * orbitRadius;
  const arrowY = unit.y + Math.sin(angle) * orbitRadius;

  context.save();
  context.translate(arrowX, arrowY);
  context.rotate(angle);
  context.fillStyle = "rgba(201, 240, 227, 0.95)";
  context.beginPath();
  context.moveTo(7, 0);
  context.lineTo(-4, -4);
  context.lineTo(-1, 0);
  context.lineTo(-4, 4);
  context.closePath();
  context.fill();
  context.restore();
}

function getDistanceSquared(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

function drawBar(
  context: CanvasRenderingContext2D,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    current: number;
    max: number;
    fill: string;
    background: string;
    stroke: string;
  },
): void {
  const ratio = options.max <= 0 ? 0 : Math.max(0, Math.min(1, options.current / options.max));

  context.fillStyle = options.background;
  context.fillRect(options.x, options.y, options.width, options.height);

  context.fillStyle = options.fill;
  context.fillRect(options.x, options.y, options.width * ratio, options.height);

  context.strokeStyle = options.stroke;
  context.lineWidth = 1;
  context.strokeRect(options.x, options.y, options.width, options.height);
}
