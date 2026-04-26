export const TANK_ARCHETYPE = {
  role: "tank" as const,
  radius: 18,
  speed: 210,
  hp: 150,
  maxHp: 150,
  startingAggro: {
    primary: 120,
    secondary: 90,
  },
};

export const TANK_ROLE_ABILITY = {
  name: "Guard Slam",
  description: "Extra control and damage into adds, with a small self-heal.",
  cooldown: 7,
  bossDamage: 18,
  addDamage: 24,
  selfHeal: 8,
  addAggro: 36,
  bossAggro: 90,
};

export const TANK_UNITS = [
  {
    id: "tank-1",
    name: "Brom",
    x: 560,
    y: 276,
    color: "#4fa7d8",
  },
  {
    id: "tank-2",
    name: "Serah",
    x: 720,
    y: 276,
    color: "#57bee8",
  },
] as const;
