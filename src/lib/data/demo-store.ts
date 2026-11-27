import type { BudgetItem, Profile, ScheduleBlock, Scenario } from "@/lib/domain/types";
import { buildExamplePlan } from "./demo-example";

/**
 * In-memory storage for demo mode, keyed by a random per-browser session ID.
 *
 * - Lives in server memory: it resets when the server restarts. That is the
 *   point: demo mode needs no database and stores nothing permanently.
 * - Each session can only reach its own state (see DemoRepository).
 * - Capped in size; the least recently used sessions are evicted.
 */

export interface DemoState {
  profile: Profile;
  scenario: Scenario;
  budgetItems: BudgetItem[];
  scheduleBlocks: ScheduleBlock[];
}

const MAX_SESSIONS = 500;

type Store = Map<string, DemoState>;
const globalForDemo = globalThis as unknown as { __nycReadyDemoStore?: Store };

function store(): Store {
  // Kept on globalThis so dev-server hot reloads don't wipe demo data.
  globalForDemo.__nycReadyDemoStore ??= new Map();
  return globalForDemo.__nycReadyDemoStore;
}

export type DemoStart = "example" | "blank";

export function createDemoState(sessionId: string, start: DemoStart): DemoState {
  const scenario: Scenario = {
    id: `scenario-${sessionId}`,
    name: start === "example" ? "Example plan (demo data)" : "My NYC plan",
    description: null,
    monthlyTakeHomeIncomeCents: null,
    currentSavingsCents: null,
    isPrimary: true,
  };
  const blankProfile: Profile = {
    id: sessionId,
    fullName: null,
    expectedMoveDate: null,
    annualGrossIncomeCents: null,
    monthlyTakeHomeIncomeCents: null,
    currentSavingsCents: null,
    householdSize: null,
    livingArrangement: null,
    preferredNeighborhoods: [],
    workLocation: null,
    commuteDaysPerWeek: null,
    lifestylePreferences: [],
    onboardingCompletedAt: null,
  };
  if (start === "blank") return { profile: blankProfile, scenario, budgetItems: [], scheduleBlocks: [] };
  return { scenario, ...buildExamplePlan(sessionId, scenario.id, blankProfile) };
}

export function getDemoState(sessionId: string): DemoState {
  const sessions = store();
  let state = sessions.get(sessionId);
  if (state) {
    // Refresh recency for LRU eviction.
    sessions.delete(sessionId);
  } else {
    // Unknown (e.g. server restarted): start again from the example plan.
    state = createDemoState(sessionId, "example");
  }
  sessions.set(sessionId, state);
  while (sessions.size > MAX_SESSIONS) {
    const oldest = sessions.keys().next().value;
    if (oldest === undefined) break;
    sessions.delete(oldest);
  }
  return state;
}

export function resetDemoState(sessionId: string, start: DemoStart): DemoState {
  const state = createDemoState(sessionId, start);
  store().set(sessionId, state);
  return state;
}

export function deleteDemoState(sessionId: string): void {
  store().delete(sessionId);
}
