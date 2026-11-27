import { describe, expect, it } from "vitest";
import { DEMO_CATALOG } from "./demo-data";
import { applyCatalogQuery, lowestUnitPriceCents } from "./query";
import { describeQuantity, shouldShowUnitPrice, unitPriceCents } from "./unit-price";

describe("applyCatalogQuery", () => {
  it("searches by name and requires all terms", () => {
    const results = applyCatalogQuery(DEMO_CATALOG, { search: "milk" });
    expect(results[0]?.item.slug).toBe("whole-milk-gallon");
    expect(applyCatalogQuery(DEMO_CATALOG, { search: "milk unicorn" })).toHaveLength(0);
  });

  it("filters by top-level or child category", () => {
    const groceries = applyCatalogQuery(DEMO_CATALOG, { categoryId: "groceries" });
    expect(groceries.length).toBeGreaterThan(5);
    expect(groceries.every((e) => e.item.categoryId.startsWith("groceries"))).toBe(true);
    const dairy = applyCatalogQuery(DEMO_CATALOG, { categoryId: "groceries.dairy_eggs" });
    expect(dairy.every((e) => e.item.categoryId === "groceries.dairy_eggs")).toBe(true);
  });

  it("filters prices by price type", () => {
    expect(applyCatalogQuery(DEMO_CATALOG, { priceType: "verified_observation" })).toHaveLength(0);
    expect(applyCatalogQuery(DEMO_CATALOG, { priceType: "demo" }).length).toBe(DEMO_CATALOG.length);
  });

  it("sorts by price", () => {
    const sorted = applyCatalogQuery(DEMO_CATALOG, { categoryId: "fitness", sort: "price_asc" });
    const prices = sorted.map((e) => Math.min(...e.prices.map((p) => p.priceCents)));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});

describe("unit pricing", () => {
  it("compares differently sized packages by unit price", () => {
    // $5.00 per gallon vs $3.00 per half gallon ($6.00 / gallon)
    expect(unitPriceCents(500, 1)).toBe(500);
    expect(unitPriceCents(300, 0.5)).toBe(600);
    const milk = DEMO_CATALOG.find((e) => e.item.slug === "whole-milk-gallon");
    expect(milk && lowestUnitPriceCents(milk)).toBe(500);
  });
  it("handles missing quantities", () => {
    expect(unitPriceCents(500, null)).toBeNull();
    expect(unitPriceCents(500, 0)).toBeNull();
  });
  it("hides unit prices that would just repeat the price", () => {
    expect(shouldShowUnitPrice("month", 1)).toBe(false);
    expect(shouldShowUnitPrice("each", 6)).toBe(true);
    expect(shouldShowUnitPrice("lb", 1)).toBe(true);
    expect(describeQuantity(0.5, "gallon")).toBe("0.5 gallon");
  });
});
