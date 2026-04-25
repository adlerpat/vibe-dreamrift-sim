export type Role = "tank" | "damage" | "healer";
export type GameMode = Role | "raidleader";
export type AbilityId = "melee" | "ranged" | "role";

export type Unit = {
  id: string;
  name: string;
  role: Role;
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  hp: number;
  maxHp: number;
};

export type Boss = {
  name: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
};

export type CombatLogEntry = {
  id: string;
  text: string;
  emphasis?: "damage" | "heal" | "utility";
};

export type AbilityView = {
  id: AbilityId;
  slotLabel: "1" | "2" | "3";
  name: string;
  description: string;
  cooldownRemaining: number;
  cooldownDuration: number;
  ready: boolean;
};

export type HudSnapshot = {
  unitName: string;
  roleLabel: string;
  unitHp: number;
  unitMaxHp: number;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  raidFrames: Array<{
    id: string;
    name: string;
    roleLabel: string;
    hp: number;
    maxHp: number;
    healthPercent: number;
    color: string;
  }>;
  abilities: AbilityView[];
  logEntries: CombatLogEntry[];
};

export type GameState = {
  mode: GameMode;
  selectedUnitId: string;
  units: Unit[];
  boss: Boss;
  cooldowns: Record<AbilityId, number>;
  logEntries: CombatLogEntry[];
  auraPulseTimer: number;
  encounterFinished: boolean;
};

export type SelectionSummary = {
  selectedRole: GameMode;
  unitName: string;
  roleLabel: string;
  hintText: string;
};

const MAX_LOG_ENTRIES = 4;

export function createInitialState(): GameState {
  const units: Unit[] = [
    {
      id: "tank-1",
      name: "Brom",
      role: "tank",
      x: 560,
      y: 276,
      radius: 18,
      speed: 210,
      color: "#4fa7d8",
      hp: 150,
      maxHp: 150,
    },
    {
      id: "tank-2",
      name: "Serah",
      role: "tank",
      x: 720,
      y: 276,
      radius: 18,
      speed: 210,
      color: "#57bee8",
      hp: 150,
      maxHp: 150,
    },
    {
      id: "damage-1",
      name: "Ariyn",
      role: "damage",
      x: 514,
      y: 496,
      radius: 16,
      speed: 250,
      color: "#d87552",
      hp: 110,
      maxHp: 110,
    },
    {
      id: "damage-2",
      name: "Kael",
      role: "damage",
      x: 766,
      y: 496,
      radius: 16,
      speed: 250,
      color: "#ef9568",
      hp: 110,
      maxHp: 110,
    },
    {
      id: "healer-1",
      name: "Mira",
      role: "healer",
      x: 596,
      y: 548,
      radius: 16,
      speed: 230,
      color: "#96df84",
      hp: 100,
      maxHp: 100,
    },
    {
      id: "healer-2",
      name: "Thalen",
      role: "healer",
      x: 684,
      y: 548,
      radius: 16,
      speed: 230,
      color: "#c4f0a4",
      hp: 100,
      maxHp: 100,
    },
  ];

  return {
    mode: "damage",
    selectedUnitId: "damage-1",
    units,
    boss: {
      name: "Kimärus",
      x: 640,
      y: 324,
      radius: 42,
      hp: 1200,
      maxHp: 1200,
    },
    cooldowns: {
      melee: 0,
      ranged: 0,
      role: 0,
    },
    logEntries: [
      {
        id: crypto.randomUUID(),
        text: "Encounter ready. Use 1, 2, and 3 to test your role toolkit.",
        emphasis: "utility",
      },
    ],
    auraPulseTimer: 3.5,
    encounterFinished: false,
  };
}

export function getSelectedUnit(state: GameState): Unit {
  const selectedUnit = state.units.find((unit) => unit.id === state.selectedUnitId);

  if (!selectedUnit) {
    throw new Error(`Selected unit "${state.selectedUnitId}" was not found.`);
  }

  return selectedUnit;
}

export function setGameMode(state: GameState, mode: GameMode): SelectionSummary {
  state.mode = mode;
  const nextUnit = selectUnitForMode(state, mode);
  state.selectedUnitId = nextUnit.id;
  resetCooldowns(state);
  addLogEntry(
    state,
    `Role focus shifted to ${nextUnit.name}. ${getRoleActionName(nextUnit.role)} is now on the action bar.`,
    "utility",
  );
  return getSelectionSummary(state);
}

export function cycleSelectedUnit(state: GameState): SelectionSummary {
  const currentIndex = state.units.findIndex((unit) => unit.id === state.selectedUnitId);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % state.units.length : 0;
  state.selectedUnitId = state.units[nextIndex].id;
  resetCooldowns(state);
  addLogEntry(
    state,
    `Raidleader focus moved to ${state.units[nextIndex].name}.`,
    "utility",
  );
  return getSelectionSummary(state);
}

export function tickCooldowns(state: GameState, deltaSeconds: number): void {
  for (const abilityId of Object.keys(state.cooldowns) as AbilityId[]) {
    state.cooldowns[abilityId] = Math.max(0, state.cooldowns[abilityId] - deltaSeconds);
  }
}

export function tickEncounter(state: GameState, deltaSeconds: number): void {
  if (state.encounterFinished) {
    return;
  }

  if (state.boss.hp <= 0) {
    state.encounterFinished = true;
    addLogEntry(state, "Dreamrift collapses. Prototype victory.", "utility");
    return;
  }

  state.auraPulseTimer -= deltaSeconds;

  if (state.auraPulseTimer > 0) {
    return;
  }

  state.auraPulseTimer = 3.5;
  applyAuraPulse(state);
}

export function useAbility(state: GameState, abilityId: AbilityId): boolean {
  if (state.cooldowns[abilityId] > 0) {
    return false;
  }

  if (state.encounterFinished) {
    return false;
  }

  const unit = getSelectedUnit(state);

  if (abilityId === "melee") {
    if (!isInRange(unit, state.boss, 88)) {
      addLogEntry(state, `${unit.name} is too far away to land a melee strike.`, "utility");
      return false;
    }

    state.boss.hp = Math.max(0, state.boss.hp - 42);
    state.cooldowns.melee = 1.1;
    addLogEntry(state, `${unit.name} slashes Dreamrift for 42 damage.`, "damage");
    return true;
  }

  if (abilityId === "ranged") {
    state.boss.hp = Math.max(0, state.boss.hp - 26);
    state.cooldowns.ranged = 1.8;
    addLogEntry(state, `${unit.name} lands a ranged hit for 26 damage.`, "damage");
    return true;
  }

  return useRoleAbility(state, unit);
}

export function getSelectionSummary(state: GameState): SelectionSummary {
  const unit = getSelectedUnit(state);

  return {
    selectedRole: state.mode,
    unitName: unit.name,
    roleLabel: getRoleLabel(unit.role),
    hintText:
      state.mode === "raidleader"
        ? "Raidleader mode can move one raider at a time for now. Press Tab to cycle through the raid."
        : `Move ${unit.name} with WASD and use 1, 2, and 3 to rehearse ${getRoleLabel(unit.role).toLowerCase()} decisions.`,
  };
}

export function getHudSnapshot(state: GameState): HudSnapshot {
  const unit = getSelectedUnit(state);
  const roleAction = getRoleAction(unit.role);

  return {
    unitName: unit.name,
    roleLabel: getRoleLabel(unit.role),
    unitHp: unit.hp,
    unitMaxHp: unit.maxHp,
    bossName: state.boss.name,
    bossHp: state.boss.hp,
    bossMaxHp: state.boss.maxHp,
    raidFrames: state.units.map((raidUnit) => ({
      id: raidUnit.id,
      name: raidUnit.name,
      roleLabel: getRoleLabel(raidUnit.role),
      hp: raidUnit.hp,
      maxHp: raidUnit.maxHp,
      healthPercent: raidUnit.maxHp <= 0 ? 0 : (raidUnit.hp / raidUnit.maxHp) * 100,
      color: raidUnit.color,
    })),
    abilities: [
      {
        id: "melee",
        slotLabel: "1",
        name: "Melee Attack",
        description: "High damage up close.",
        cooldownRemaining: state.cooldowns.melee,
        cooldownDuration: 1.1,
        ready: state.cooldowns.melee <= 0,
      },
      {
        id: "ranged",
        slotLabel: "2",
        name: "Ranged Attack",
        description: "Reliable damage from anywhere.",
        cooldownRemaining: state.cooldowns.ranged,
        cooldownDuration: 1.8,
        ready: state.cooldowns.ranged <= 0,
      },
      {
        id: "role",
        slotLabel: "3",
        name: roleAction.name,
        description: roleAction.description,
        cooldownRemaining: state.cooldowns.role,
        cooldownDuration: roleAction.cooldown,
        ready: state.cooldowns.role <= 0,
      },
    ],
    logEntries: state.logEntries,
  };
}

function selectUnitForMode(state: GameState, mode: GameMode): Unit {
  if (mode === "raidleader") {
    return getSelectedUnit(state);
  }

  const matchingUnit = state.units.find((unit) => unit.role === mode);

  if (!matchingUnit) {
    throw new Error(`No unit found for mode "${mode}".`);
  }

  return matchingUnit;
}

function useRoleAbility(state: GameState, unit: Unit): boolean {
  if (unit.role === "tank") {
    state.cooldowns.role = 7;
    state.boss.hp = Math.max(0, state.boss.hp - 18);
    unit.hp = Math.min(unit.maxHp, unit.hp + 8);
    addLogEntry(state, `${unit.name} uses Guard Slam: 18 damage and 8 self-healing.`, "utility");
    return true;
  }

  if (unit.role === "healer") {
    const target = getLowestHealthUnit(state.units);
    const healAmount = 34;
    const healedFor = Math.min(healAmount, target.maxHp - target.hp);

    if (healedFor <= 0) {
      addLogEntry(state, `${unit.name} finds no urgent healing target.`, "utility");
      return false;
    }

    target.hp += healedFor;
    state.cooldowns.role = 4.5;
    addLogEntry(state, `${unit.name} restores ${healedFor} health to ${target.name}.`, "heal");
    return true;
  }

  state.cooldowns.role = 5.5;
  state.boss.hp = Math.max(0, state.boss.hp - 64);
  addLogEntry(state, `${unit.name} unleashes Dreamburst for 64 damage.`, "damage");
  return true;
}

function getLowestHealthUnit(units: Unit[]): Unit {
  return units.reduce((lowest, current) => {
    const currentMissing = current.maxHp - current.hp;
    const lowestMissing = lowest.maxHp - lowest.hp;
    return currentMissing > lowestMissing ? current : lowest;
  });
}

function applyAuraPulse(state: GameState): void {
  const targets = state.units.filter((unit) => unit.hp > 0);

  if (targets.length === 0) {
    return;
  }

  const target = targets.reduce((lowest, current) => {
    const currentRatio = current.hp / current.maxHp;
    const lowestRatio = lowest.hp / lowest.maxHp;
    return currentRatio < lowestRatio ? current : lowest;
  });

  const damage = target.role === "tank" ? 14 : 19;
  target.hp = Math.max(0, target.hp - damage);
  addLogEntry(state, `Nightmare Pulse hits ${target.name} for ${damage} damage.`, "damage");
}

function resetCooldowns(state: GameState): void {
  state.cooldowns.melee = 0;
  state.cooldowns.ranged = 0;
  state.cooldowns.role = 0;
}

function isInRange(unit: Unit, boss: Boss, extraRange: number): boolean {
  const dx = unit.x - boss.x;
  const dy = unit.y - boss.y;
  const distance = Math.hypot(dx, dy);
  return distance <= boss.radius + unit.radius + extraRange;
}

function addLogEntry(
  state: GameState,
  text: string,
  emphasis: CombatLogEntry["emphasis"] = "utility",
): void {
  state.logEntries = [
    {
      id: crypto.randomUUID(),
      text,
      emphasis,
    },
    ...state.logEntries,
  ].slice(0, MAX_LOG_ENTRIES);
}

function getRoleLabel(role: Role): string {
  if (role === "damage") {
    return "Damage Dealer";
  }

  if (role === "tank") {
    return "Tank";
  }

  return "Healer";
}

function getRoleActionName(role: Role): string {
  return getRoleAction(role).name;
}

function getRoleAction(role: Role): { name: string; description: string; cooldown: number } {
  if (role === "tank") {
    return {
      name: "Guard Slam",
      description: "Taunt pressure, chip damage, and a small self-heal.",
      cooldown: 7,
    };
  }

  if (role === "healer") {
    return {
      name: "Verdant Mend",
      description: "Smart-heal the ally missing the most health.",
      cooldown: 4.5,
    };
  }

  return {
    name: "Dreamburst",
    description: "A heavy DPS cooldown for burst windows.",
    cooldown: 5.5,
  };
}
