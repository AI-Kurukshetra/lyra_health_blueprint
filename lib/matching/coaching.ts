interface CoachingInput {
  focusAreas: string[];
  preferredLanguages: string[];
  preferredTimezone: string;
}

interface CoachCandidate {
  id: string;
  fullName: string;
  coachingFocusAreas: string[];
  languages: string[];
  timezone: string;
  nextAvailableAt: string | null;
  nextAvailabilityId: string | null;
  yearsExperience: number | null;
}

export interface CoachingMatch extends CoachCandidate {
  score: number;
  reasons: string[];
}

function containsAny(source: string[], targets: string[]) {
  const normalizedSource = source.map((value) => value.toLowerCase());
  return targets.some((target) => normalizedSource.includes(target.toLowerCase()));
}

export function rankCoaches(input: CoachingInput, candidates: CoachCandidate[]): CoachingMatch[] {
  return candidates
    .map((candidate) => {
      let score = 0;
      const reasons: string[] = [];

      if (input.focusAreas.length > 0 && containsAny(candidate.coachingFocusAreas, input.focusAreas)) {
        score += 45;
        reasons.push("focus area alignment");
      }

      if (
        input.preferredLanguages.length > 0 &&
        containsAny(candidate.languages, input.preferredLanguages)
      ) {
        score += 20;
        reasons.push("language preference match");
      }

      if (candidate.timezone === input.preferredTimezone) {
        score += 15;
        reasons.push("timezone match");
      }

      if (candidate.nextAvailableAt) {
        const days =
          (new Date(candidate.nextAvailableAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (days <= 2) {
          score += 15;
          reasons.push("near-term availability");
        } else if (days <= 7) {
          score += 10;
          reasons.push("availability this week");
        }
      }

      if (candidate.yearsExperience && candidate.yearsExperience >= 5) {
        score += 5;
        reasons.push("experienced coach");
      }

      return {
        ...candidate,
        score,
        reasons: reasons.length > 0 ? reasons : ["general coaching fit"],
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.nextAvailableAt ? new Date(a.nextAvailableAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.nextAvailableAt ? new Date(b.nextAvailableAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
}
