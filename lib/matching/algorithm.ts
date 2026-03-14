interface MatchInput {
  concerns: string[];
  preferredLanguages: string[];
  preferredTimezone: string;
  severityScore: number;
  careFormatPreference?: "video" | "in_person" | "hybrid";
  coachingInterest?: boolean;
  providerStyle?: "structured" | "supportive" | "directive" | "no_preference";
  identityPreferences?: string[];
  culturalPreferences?: string[];
  urgencyLevel?: "routine" | "priority" | "urgent";
}

interface ProviderCandidate {
  id: string;
  fullName: string;
  specialties: string[];
  languages: string[];
  timezone: string;
  nextAvailableAt: string | null;
  careModalities?: string[];
  coachingFocusAreas?: string[];
  culturalSpecialties?: string[];
  providerStyle?: string | null;
  genderIdentity?: string | null;
  yearsExperience?: number | null;
}

export interface MatchResult extends ProviderCandidate {
  score: number;
  fitTier: "excellent" | "strong" | "good" | "baseline";
  reasons: string[];
}

function includesAny(haystack: string[], needles: string[]) {
  const normalizedHaystack = haystack.map((value) => value.toLowerCase());
  return needles.some((needle) => normalizedHaystack.includes(needle.toLowerCase()));
}

function inferConcernWeight(input: MatchInput) {
  if (input.severityScore >= 20 || input.urgencyLevel === "urgent") return 1.3;
  if (input.severityScore >= 10 || input.urgencyLevel === "priority") return 1.15;
  return 1;
}

function fitTierFromScore(score: number): MatchResult["fitTier"] {
  if (score >= 85) return "excellent";
  if (score >= 65) return "strong";
  if (score >= 45) return "good";
  return "baseline";
}

export function rankProviders(
  input: MatchInput,
  candidates: ProviderCandidate[],
): MatchResult[] {
  const concernWeight = inferConcernWeight(input);

  return candidates
    .map((candidate) => {
      let score = 0;
      const reasons: string[] = [];
      const specialties = candidate.specialties ?? [];
      const modalities = candidate.careModalities ?? [];
      const coachingFocus = candidate.coachingFocusAreas ?? [];
      const culturalSpecialties = candidate.culturalSpecialties ?? [];
      const preferredStyle = input.providerStyle ?? "no_preference";

      const concernMatchCount = input.concerns.filter((concern) =>
        includesAny(specialties, [concern]),
      ).length;
      if (concernMatchCount > 0) {
        score += Math.round(30 * concernWeight + concernMatchCount * 8);
        reasons.push("clinical concern alignment");
      }

      if (input.coachingInterest && includesAny(coachingFocus, input.concerns)) {
        score += 8;
        reasons.push("coaching fit");
      }

      if (input.preferredLanguages.length > 0 && includesAny(candidate.languages, input.preferredLanguages)) {
        score += 18;
        reasons.push("language preference match");
      }

      if (candidate.timezone === input.preferredTimezone) {
        score += 12;
        reasons.push("timezone match");
      }

      if (
        input.careFormatPreference &&
        input.careFormatPreference !== "hybrid" &&
        includesAny(modalities, [input.careFormatPreference])
      ) {
        score += 12;
        reasons.push("care format match");
      }

      if (
        preferredStyle !== "no_preference" &&
        candidate.providerStyle &&
        candidate.providerStyle.toLowerCase() === preferredStyle
      ) {
        score += 8;
        reasons.push("provider style match");
      }

      if (input.identityPreferences && input.identityPreferences.length > 0 && candidate.genderIdentity) {
        if (includesAny([candidate.genderIdentity], input.identityPreferences)) {
          score += 6;
          reasons.push("identity preference match");
        }
      }

      if (input.culturalPreferences && input.culturalPreferences.length > 0) {
        if (includesAny(culturalSpecialties, input.culturalPreferences)) {
          score += 8;
          reasons.push("cultural affinity match");
        }
      }

      if (candidate.yearsExperience && candidate.yearsExperience >= 5) {
        score += 4;
        reasons.push("experienced clinician");
      }

      if (candidate.nextAvailableAt) {
        const availabilityDate = new Date(candidate.nextAvailableAt).getTime();
        const now = Date.now();
        const daysToAvailability = (availabilityDate - now) / (1000 * 60 * 60 * 24);
        if (daysToAvailability <= 1) {
          score += 14;
          reasons.push("next-day availability");
        } else if (daysToAvailability <= 3) {
          score += 10;
          reasons.push("near-term availability");
        } else if (daysToAvailability <= 7) {
          score += 6;
          reasons.push("availability this week");
        }
      }

      return {
        ...candidate,
        score,
        fitTier: fitTierFromScore(score),
        reasons: reasons.length > 0 ? reasons : ["baseline compatibility"],
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aTime = a.nextAvailableAt ? new Date(a.nextAvailableAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.nextAvailableAt ? new Date(b.nextAvailableAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
}
