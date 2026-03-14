import { describe, expect, it } from "vitest";
import { rankProviders } from "@/lib/matching/algorithm";

describe("rankProviders", () => {
  it("prioritizes specialty, language, timezone, and near-term availability", () => {
    const results = rankProviders(
      {
        concerns: ["anxiety"],
        preferredLanguages: ["English"],
        preferredTimezone: "Asia/Kolkata",
        severityScore: 12,
      },
      [
        {
          id: "provider-1",
          fullName: "Provider 1",
          specialties: ["anxiety", "stress"],
          languages: ["English"],
          timezone: "Asia/Kolkata",
          nextAvailableAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "provider-2",
          fullName: "Provider 2",
          specialties: ["sleep"],
          languages: ["Spanish"],
          timezone: "UTC",
          nextAvailableAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    );

    expect(results[0]?.id).toBe("provider-1");
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });
});

