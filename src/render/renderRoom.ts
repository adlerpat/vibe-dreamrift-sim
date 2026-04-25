type RoomRenderState = {
  width: number;
  height: number;
  elapsedSeconds: number;
  activeTelegraph: {
    label: string;
    x: number;
    y: number;
    radius: number;
    timeRemaining: number;
    totalDuration: number;
  } | null;
};

export function renderRoom(context: CanvasRenderingContext2D, state: RoomRenderState): void {
  const { width, height, elapsedSeconds, activeTelegraph } = state;

  context.clearRect(0, 0, width, height);

  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#152735");
  background.addColorStop(0.55, "#0e1b27");
  background.addColorStop(1, "#081017");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  drawVignette(context, width, height);
  drawArenaFloor(context, width, height, elapsedSeconds);
  drawTelegraph(context, activeTelegraph, elapsedSeconds);
  drawBossPlatform(context, width, height);
}

function drawVignette(context: CanvasRenderingContext2D, width: number, height: number): void {
  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    100,
    width / 2,
    height / 2,
    width / 1.2,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(2, 6, 10, 0.5)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

function drawArenaFloor(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsedSeconds: number,
): void {
  const arenaX = 30;
  const arenaY = 38;
  const arenaWidth = width - 60;
  const arenaHeight = height - 76;
  const outerRadius = 42;
  const innerRadius = 34;

  context.fillStyle = "#10202b";
  roundRect(context, arenaX, arenaY, arenaWidth, arenaHeight, outerRadius);
  context.fill();

  context.save();
  roundRect(context, arenaX, arenaY, arenaWidth, arenaHeight, outerRadius);
  context.clip();

  const pulse = 0.55 + Math.sin(elapsedSeconds * 1.8) * 0.08;
  context.strokeStyle = `rgba(135, 214, 173, ${pulse})`;
  context.lineWidth = 2;

  for (let x = arenaX + 28; x < arenaX + arenaWidth; x += 56) {
    context.beginPath();
    context.moveTo(x, arenaY);
    context.lineTo(x, arenaY + arenaHeight);
    context.stroke();
  }

  for (let y = arenaY + 28; y < arenaY + arenaHeight; y += 56) {
    context.beginPath();
    context.moveTo(arenaX, y);
    context.lineTo(arenaX + arenaWidth, y);
    context.stroke();
  }

  context.restore();

  context.strokeStyle = "rgba(214, 193, 148, 0.25)";
  context.lineWidth = 4;
  roundRect(context, arenaX, arenaY, arenaWidth, arenaHeight, outerRadius);
  context.stroke();

  context.strokeStyle = "rgba(86, 118, 103, 0.4)";
  context.lineWidth = 1;
  roundRect(context, arenaX + 12, arenaY + 12, arenaWidth - 24, arenaHeight - 24, innerRadius);
  context.stroke();
}

function drawBossPlatform(context: CanvasRenderingContext2D, width: number, height: number): void {
  const centerX = width / 2;
  const centerY = height / 2 - 36;

  const glow = context.createRadialGradient(centerX, centerY, 24, centerX, centerY, 150);
  glow.addColorStop(0, "rgba(154, 238, 187, 0.22)");
  glow.addColorStop(1, "rgba(154, 238, 187, 0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(centerX, centerY, 150, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#132732";
  context.beginPath();
  context.ellipse(centerX, centerY, 124, 92, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(217, 232, 199, 0.32)";
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(centerX, centerY, 124, 92, 0, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = "rgba(129, 205, 166, 0.3)";
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(centerX, centerY, 78, 54, 0, 0, Math.PI * 2);
  context.stroke();
}

function drawTelegraph(
  context: CanvasRenderingContext2D,
  telegraph: RoomRenderState["activeTelegraph"],
  elapsedSeconds: number,
): void {
  if (!telegraph) {
    return;
  }

  const progress = telegraph.totalDuration <= 0 ? 0 : telegraph.timeRemaining / telegraph.totalDuration;
  const pulse = 0.55 + Math.sin(elapsedSeconds * 9) * 0.08;

  context.save();

  context.fillStyle = `rgba(196, 70, 96, ${0.16 + (1 - progress) * 0.14})`;
  context.beginPath();
  context.arc(telegraph.x, telegraph.y, telegraph.radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = `rgba(248, 172, 190, ${pulse})`;
  context.lineWidth = 4;
  context.beginPath();
  context.arc(telegraph.x, telegraph.y, telegraph.radius, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = "rgba(255, 226, 233, 0.24)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(telegraph.x, telegraph.y, telegraph.radius * Math.max(0.18, progress), 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "rgba(255, 240, 244, 0.92)";
  context.font = "700 14px Trebuchet MS";
  context.textAlign = "center";
  context.fillText(telegraph.label, telegraph.x, telegraph.y - telegraph.radius - 12);

  context.restore();
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
