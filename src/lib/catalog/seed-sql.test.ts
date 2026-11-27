import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_CATALOG } from "./demo-data";
import { buildSeedSql } from "./seed-sql";

describe("supabase/seed.sql", () => {
  it("is up to date with the demo catalog (run `npm run db:seed:generate`)", () => {
    const committed = readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8");
    expect(committed).toBe(buildSeedSql());
  });

  it("only contains demo-flagged observations", () => {
    expect(DEMO_CATALOG.every((entry) => entry.prices.every((p) => p.isDemo && p.priceType === "demo"))).toBe(true);
    expect(buildSeedSql()).toContain("'demo', 'low', true");
  });
});
