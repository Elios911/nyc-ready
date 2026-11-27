import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIES, categoryGroupsForItemType, getCategory, topLevelCategoryId } from "./categories";

describe("categories", () => {
  it("has unique IDs and valid parents", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const category of CATEGORIES) {
      if (category.parentId) {
        expect(getCategory(category.parentId)).toBeDefined();
        expect(category.id.startsWith(`${category.parentId}.`)).toBe(true);
      }
    }
  });

  it("resolves top-level groups", () => {
    expect(topLevelCategoryId("groceries.produce")).toBe("groceries");
    expect(topLevelCategoryId("groceries")).toBe("groceries");
    expect(topLevelCategoryId("unknown")).toBe("other");
  });

  it("maps item types to category groups", () => {
    expect(categoryGroupsForItemType("income")).toEqual(["income"]);
    expect(categoryGroupsForItemType("fixed")).toContain("housing");
  });

  it("matches the categories inserted by the SQL migrations", () => {
    const dir = join(process.cwd(), "supabase", "migrations");
    const sql = readdirSync(dir)
      .map((file) => readFileSync(join(dir, file), "utf8"))
      .join("\n");
    for (const category of CATEGORIES) {
      const parent = category.parentId ? `'${category.parentId}'` : "null";
      expect(sql).toContain(`('${category.id}', '${category.name.replace(/'/g, "''")}'`);
      expect(sql).toMatch(new RegExp(`\\('${category.id.replace(".", "\\.")}', '[^\\n]*', ${parent}, `));
    }
  });
});
