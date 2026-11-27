import { afterEach, describe, expect, it, vi } from "vitest";
import { getDataMode, getSupabaseConfig } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("getSupabaseConfig", () => {
  it("uses demo mode when nothing is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(getSupabaseConfig()).toBeNull();
    expect(getDataMode()).toBe("demo");
  });

  it("uses Supabase when fully configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_0123456789abcdef");
    expect(getDataMode()).toBe("supabase");
  });

  it("refuses a half-configured setup instead of silently using demo mode", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => getSupabaseConfig()).toThrow(/partially configured/);
  });
});
