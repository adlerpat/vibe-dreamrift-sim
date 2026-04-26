export const KIMARUS_BOSS = {
  id: "kimarus",
  name: "Kimärus",
  spawn: {
    x: 640,
    y: 324,
  },
  reentry: {
    x: 640,
    y: 188,
  },
  intermissionRetreat: {
    x: 640,
    y: 92,
  },
  idleAnchor: {
    x: 640,
    y: 324,
  },
  radius: 42,
  speed: 116,
  hp: 5200,
  maxHp: 5200,
  startingTargetUnitId: "tank-1",
  consumeDamagePerAdd: 80,
  insatiableBossHealPerAdd: 90,
  reengageAggro: {
    tank1: 140,
    tank2: 110,
    damage: 36,
    healer: 24,
  },
} as const;
