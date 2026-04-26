export const DAMAGE_ARCHETYPE = {
  role: "damage" as const,
  radius: 16,
  speed: 250,
  hp: 110,
  maxHp: 110,
  startingAggro: 28,
};

export const DAMAGE_ROLE_ABILITY = {
  name: "Dreamburst",
  description: "High burst damage into adds or the boss.",
  cooldown: 5.5,
  damage: 64,
  addAggro: 24,
  bossAggro: 64,
};

export const DAMAGE_UNITS = [
  {
    id: "damage-1",
    name: "Ariyn",
    x: 514,
    y: 496,
    color: "#d87552",
  },
  {
    id: "damage-2",
    name: "Kael",
    x: 766,
    y: 496,
    color: "#ef9568",
  },
] as const;
