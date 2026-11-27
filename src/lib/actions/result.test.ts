import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { safeNextPath } from "./result";

describe("safeNextPath", () => {
  it("allows relative paths and blocks open redirects", () => {
    expect(safeNextPath("/budget?x=1")).toBe("/budget?x=1");
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath(undefined, "/onboarding")).toBe("/onboarding");
  });
});
