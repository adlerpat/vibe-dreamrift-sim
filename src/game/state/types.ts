import type { EncounterPhase, SpellId } from "../../data/bosses/chimaerus";

export type Role = "tank" | "damage" | "healer";
export type GameMode = Role | "raidleader";
export type AbilityId = "melee" | "ranged" | "role";
export type TelegraphShape = "circle" | "line";
export type AddKind = "colossal_horror" | "swarming_shade";
export type PhaseLayer = "material" | "rift";

export type Unit = {
  id: string;
  name: string;
  role: Role;
  phase: PhaseLayer;
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  hp: number;
  maxHp: number;
  pendingRecoverySeconds: number;
};

export type Boss = {
  name: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: PhaseLayer;
  hp: number;
  maxHp: number;
  energy: number;
  visible: boolean;
  attackable: boolean;
  damageBoostStacks: number;
  targetUnitId: string | null;
};

export type EncounterAdd = {
  id: string;
  kind: AddKind;
  name: string;
  phase: PhaseLayer;
  targetTankId: string | null;
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  color: string;
};

export type GroundTelegraph = {
  id: string;
  label: string;
  shape: TelegraphShape;
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  angle?: number;
  timeRemaining: number;
  totalDuration: number;
};

export type ActiveSpell = {
  spellId: SpellId;
  label: string;
  timeRemaining: number;
  totalDuration: number;
  telegraph: GroundTelegraph | null;
  payload?: Record<string, string | number>;
};

export type QueuedSpell = {
  spellId: SpellId;
  source: "cooldown" | "chance_window" | "follow_up" | "energy" | "phase_timer";
  priority: number;
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
  encounterFinished: boolean;
  bossCastLabel: string | null;
  bossCastRemaining: number;
  selectedUnitPhase: PhaseLayer;
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
  aggro: Record<string, number>;
  adds: EncounterAdd[];
  cooldowns: Record<AbilityId, number>;
  logEntries: CombatLogEntry[];
  encounterFinished: boolean;
  encounterTime: number;
  phase: EncounterPhase;
  phaseTime: number;
  activeSpell: ActiveSpell | null;
  spellQueue: QueuedSpell[];
  spellCooldowns: Record<string, number>;
  spellCastCounts: Record<string, number>;
  spellChanceCheckTimers: Record<string, number>;
  spellPhaseFlags: Record<string, boolean>;
  raidAutoAttackTimer: number;
  lastAlndustTankId: string | null;
  pendingConsumeAfterRift: boolean;
  consumeDelay: number;
  intermissionDevastationsRemaining: number;
  intermissionSpellDelay: number;
  pendingRavenousDive: boolean;
};

export type SelectionSummary = {
  selectedRole: GameMode;
  unitId: string;
  unitName: string;
  roleLabel: string;
  hintText: string;
};
