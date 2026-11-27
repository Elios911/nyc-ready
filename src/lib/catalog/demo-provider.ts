import { DEMO_CATALOG, DEMO_SOURCE } from "./demo-data";
import { applyCatalogQuery } from "./query";
import type { CatalogProvider } from "./types";

/** Serves the bundled, clearly labelled demonstration catalog. No network or database. */
export const demoCatalogProvider: CatalogProvider = {
  kind: "demo",
  async search(query) {
    return applyCatalogQuery(DEMO_CATALOG, query);
  },
  async getEntry(costItemId) {
    return DEMO_CATALOG.find((entry) => entry.item.id === costItemId) ?? null;
  },
  async listSources() {
    return [DEMO_SOURCE];
  },
};
