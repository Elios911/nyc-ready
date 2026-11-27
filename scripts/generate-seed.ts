/**
 * Writes supabase/seed.sql from the bundled demonstration catalog
 * (src/lib/catalog/demo-data.ts), so demo mode and a fresh Supabase project
 * show exactly the same clearly labelled demo data.
 *
 *   npm run db:seed:generate
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSeedSql } from "../src/lib/catalog/seed-sql";

const target = join(process.cwd(), "supabase", "seed.sql");
writeFileSync(target, buildSeedSql());
console.log(`Wrote ${target}`);
