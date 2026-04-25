import type { Boss, Unit } from "../game/state";

type UnitRenderState = {
  units: Unit[];
  boss: Boss;
  selectedUnitId: string;
};

export function renderUnits(context: CanvasRenderingContext2D, state: UnitRenderState): void {
  drawBoss(context, state.boss);

  for (const unit of state.units) {
    const isSelected = unit.id === state.selectedUnitId;
    drawUnit(context, unit, isSelected);
  }
}

function drawBoss(context: CanvasRenderingContext2D, boss: Boss): void {
  const glow = context.createRadialGradient(boss.x, boss.y, 12, boss.x, boss.y, 92);
  glow.addColorStop(0, "rgba(196, 101, 124, 0.34)");
  glow.addColorStop(1, "rgba(196, 101, 124, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(boss.x, boss.y, 92, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#8f324a";
  context.beginPath();
  context.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(255, 219, 226, 0.48)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "rgba(255, 240, 244, 0.9)";
  context.font = "600 14px Trebuchet MS";
  context.textAlign = "center";
  context.fillText("Boss", boss.x, boss.y + 5);

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

function drawUnit(context: CanvasRenderingContext2D, unit: Unit, isSelected: boolean): void {
  if (isSelected) {
    context.strokeStyle = "rgba(255, 241, 184, 0.85)";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(unit.x, unit.y, unit.radius + 8, 0, Math.PI * 2);
    context.stroke();
  }

  context.fillStyle = unit.color;
  context.beginPath();
  context.arc(unit.x, unit.y, unit.radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(243, 237, 226, 0.48)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(unit.x, unit.y, unit.radius, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "#091118";
  context.font = "700 12px Trebuchet MS";
  context.textAlign = "center";
  context.fillText(getRoleShortLabel(unit.role), unit.x, unit.y + 4);

  context.fillStyle = "rgba(255, 247, 234, 0.9)";
  context.font = isSelected ? "700 14px Trebuchet MS" : "500 13px Trebuchet MS";
  context.fillText(unit.name, unit.x, unit.y - unit.radius - 12);

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
