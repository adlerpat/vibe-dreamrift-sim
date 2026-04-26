export const COMMON_PLAYER_ABILITIES = {
  melee: {
    name: "Melee Attack",
    description: "Heavy damage up close. Prioritises active adds.",
    damage: 42,
    cooldown: 1.1,
    range: 88,
    addRange: 52,
    addAggro: 22,
    bossAggro: 42,
  },
  ranged: {
    name: "Ranged Attack",
    description: "Reliable ranged damage. Prioritises active adds.",
    damage: 26,
    cooldown: 1.8,
    addAggro: 16,
    bossAggro: 26,
  },
} as const;

export const SUPPORT_RAID_DAMAGE = {
  add: {
    healer: 2,
    tank: 3,
    damage: 6,
  },
  boss: {
    healer: 4,
    tank: 7,
    damage: 9,
  },
  aggro: {
    add: {
      healer: 3,
      tank: 10,
      damage: 8,
    },
    boss: {
      healer: 2,
      tank: 9,
      damage: 7,
    },
  },
  tickInterval: 1.15,
} as const;
