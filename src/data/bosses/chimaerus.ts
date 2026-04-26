export type EncounterPhase = "phase_1" | "intermission";
export type SpellId =
  | "alndust_upheaval"
  | "rift_emergence"
  | "rending_tear"
  | "consume"
  | "corrupted_devastation"
  | "ravenous_dive";

type CooldownRule = {
  type: "cooldown";
  interval: number;
  initialDelay: number;
};

type ChanceWindowRule = {
  type: "chance_window";
  checkEvery: number;
  initialDelay: number;
  chance: number;
};

type EnergyRule = {
  type: "energy";
  threshold: number;
};

type PhaseTimerRule = {
  type: "phase_timer";
  at: number;
};

export type ScheduledSpellConfig = {
  id: SpellId;
  priority: number;
  rule: CooldownRule | ChanceWindowRule | EnergyRule | PhaseTimerRule;
};

type PhaseConfig = {
  energyPerSecond: number;
  spells: ScheduledSpellConfig[];
};

export const chimaerusConfig: {
  phases: Record<EncounterPhase, PhaseConfig>;
} = {
  phases: {
    phase_1: {
      energyPerSecond: 1.4,
      spells: [
        {
          id: "alndust_upheaval",
          priority: 7,
          rule: {
            type: "cooldown",
            interval: 24,
            initialDelay: 9,
          },
        },
        {
          id: "rending_tear",
          priority: 4,
          rule: {
            type: "cooldown",
            interval: 19,
            initialDelay: 12,
          },
        },
      ],
    },
    intermission: {
      energyPerSecond: 0,
      spells: [],
    },
  },
};
