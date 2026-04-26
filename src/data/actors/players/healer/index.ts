export const HEALER_ARCHETYPE = {
  role: "healer" as const,
  radius: 16,
  speed: 230,
  hp: 100,
  maxHp: 100,
  startingAggro: 20,
};

export const HEALER_ROLE_ABILITY = {
  name: "Verdant Mend",
  description: "Smart-heal the ally missing the most health.",
  cooldown: 4.5,
  healAmount: 34,
  aggro: 18,
};

export const HEALER_UNITS = [
  {
    id: "healer-1",
    name: "Mira",
    x: 596,
    y: 548,
    color: "#96df84",
  },
  {
    id: "healer-2",
    name: "Thalen",
    x: 684,
    y: 548,
    color: "#c4f0a4",
  },
] as const;
