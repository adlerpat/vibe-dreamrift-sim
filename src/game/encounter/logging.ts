import type { CombatLogEntry, GameState } from "../state/types";

const MAX_LOG_ENTRIES = 5;
const DEBUG_ENCOUNTER = true;

export function addLogEntry(
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

export function debugEncounter(message: string): void {
  if (!DEBUG_ENCOUNTER) {
    return;
  }

  console.log(`[Dreamrift Debug] ${message}`);
}
