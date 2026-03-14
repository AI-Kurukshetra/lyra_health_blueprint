"use client";

import { useState } from "react";
import { BrainCircuit, Globe2, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const concernOptions = [
  "anxiety",
  "depression",
  "burnout",
  "stress",
  "sleep",
  "relationships",
];

const languageOptions = ["English", "Spanish", "Hindi", "French"];
const identityOptions = ["female", "male", "non_binary", "lgbtqia+"];
const culturalOptions = ["south_asian", "african_american", "latinx", "neurodiversity", "working_parents"];

export function AssessmentForm() {
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(["stress"]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [careFormatPreference, setCareFormatPreference] = useState<"video" | "in_person" | "hybrid">("video");
  const [providerStyle, setProviderStyle] = useState<"structured" | "supportive" | "directive" | "no_preference">("no_preference");
  const [identityPreferences, setIdentityPreferences] = useState<string[]>([]);
  const [culturalPreferences, setCulturalPreferences] = useState<string[]>([]);
  const [urgencyLevel, setUrgencyLevel] = useState<"routine" | "priority" | "urgent">("routine");
  const [coachingInterest, setCoachingInterest] = useState(false);
  const [severityScore, setSeverityScore] = useState(8);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const toggleSelection = (
    value: string,
    selected: string[],
    setSelected: (next: string[]) => void,
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((item) => item !== value));
      return;
    }
    setSelected([...selected, value]);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Submitting assessment...");
    setIsSubmitting(true);

    const response = await fetch("/api/assessments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        concerns: selectedConcerns,
        preferredLanguages: selectedLanguages,
        preferredTimezone: timezone,
        severityScore,
        careFormatPreference,
        providerStyle,
        identityPreferences,
        culturalPreferences,
        urgencyLevel,
        coachingInterest,
        notes,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      const message = payload?.error ?? "Failed to submit assessment.";
      setStatus(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    setStatus("Assessment submitted successfully.");
    toast.success("Assessment submitted successfully.");
    setIsSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-6 overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-200/40 blur-3xl" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
            <BrainCircuit className="h-3.5 w-3.5" />
            Guided Intake
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900">Self-assessment</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Complete a quick profile so we can recommend the most relevant provider options.
          </p>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.12em] text-teal-700">Timezone</p>
          <p className="text-sm font-medium text-teal-800">{timezone}</p>
        </div>
      </div>

      <fieldset className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">Primary concerns</legend>
        <div className="flex flex-wrap gap-2">
          {concernOptions.map((concern) => (
            <button
              key={concern}
              type="button"
              onClick={() => toggleSelection(concern, selectedConcerns, setSelectedConcerns)}
              className={`rounded-full border px-3 py-1.5 text-sm capitalize transition-all ${
                selectedConcerns.includes(concern)
                  ? "border-teal-600 bg-teal-50 text-teal-800 shadow-sm"
                  : "border-gray-300 text-gray-700 hover:border-teal-300"
              }`}
            >
              {concern}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">Language preference</legend>
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => toggleSelection(language, selectedLanguages, setSelectedLanguages)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                selectedLanguages.includes(language)
                  ? "border-cyan-600 bg-cyan-50 text-cyan-800 shadow-sm"
                  : "border-gray-300 text-gray-700 hover:border-cyan-300"
              }`}
            >
              {language}
            </button>
          ))}
        </div>
        <p className="inline-flex items-center gap-1 text-xs text-gray-500">
          <Globe2 className="h-3.5 w-3.5" />
          Multilingual matching improves recommendation quality.
        </p>
      </fieldset>

      <label className="block rounded-2xl border border-gray-200 bg-white p-4">
        <span className="mb-2 block text-sm font-semibold text-gray-700">Severity score (0-27)</span>
        <input
          type="range"
          min={0}
          max={27}
          value={severityScore}
          onChange={(event) => setSeverityScore(Number(event.target.value))}
          className="w-full accent-teal-600"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            Score: {severityScore}
          </span>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
              style={{ width: `${Math.min(100, (severityScore / 27) * 100)}%` }}
            />
          </div>
        </div>
      </label>

      <fieldset className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">Care preferences</legend>
        <div className="flex flex-wrap gap-2">
          {(["video", "in_person", "hybrid"] as const).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => setCareFormatPreference(format)}
              className={`rounded-full border px-3 py-1.5 text-sm capitalize transition-all ${
                careFormatPreference === format
                  ? "border-teal-600 bg-teal-50 text-teal-800 shadow-sm"
                  : "border-gray-300 text-gray-700 hover:border-teal-300"
              }`}
            >
              {format.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["structured", "supportive", "directive", "no_preference"] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setProviderStyle(style)}
              className={`rounded-full border px-3 py-1.5 text-sm capitalize transition-all ${
                providerStyle === style
                  ? "border-cyan-600 bg-cyan-50 text-cyan-800 shadow-sm"
                  : "border-gray-300 text-gray-700 hover:border-cyan-300"
              }`}
            >
              {style.replace("_", " ")}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">Identity and cultural preferences (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {identityOptions.map((identity) => (
            <button
              key={identity}
              type="button"
              onClick={() => toggleSelection(identity, identityPreferences, setIdentityPreferences)}
              className={`rounded-full border px-3 py-1.5 text-sm capitalize transition-all ${
                identityPreferences.includes(identity)
                  ? "border-teal-600 bg-teal-50 text-teal-800 shadow-sm"
                  : "border-gray-300 text-gray-700 hover:border-teal-300"
              }`}
            >
              {identity.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {culturalOptions.map((culture) => (
            <button
              key={culture}
              type="button"
              onClick={() => toggleSelection(culture, culturalPreferences, setCulturalPreferences)}
              className={`rounded-full border px-3 py-1.5 text-sm capitalize transition-all ${
                culturalPreferences.includes(culture)
                  ? "border-cyan-600 bg-cyan-50 text-cyan-800 shadow-sm"
                  : "border-gray-300 text-gray-700 hover:border-cyan-300"
              }`}
            >
              {culture.replace("_", " ")}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">Urgency and coaching</legend>
        <div className="flex flex-wrap gap-2">
          {(["routine", "priority", "urgent"] as const).map((urgency) => (
            <button
              key={urgency}
              type="button"
              onClick={() => setUrgencyLevel(urgency)}
              className={`rounded-full border px-3 py-1.5 text-sm capitalize transition-all ${
                urgencyLevel === urgency
                  ? "border-amber-500 bg-amber-50 text-amber-800 shadow-sm"
                  : "border-gray-300 text-gray-700 hover:border-amber-300"
              }`}
            >
              {urgency}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={coachingInterest}
            onChange={(event) => setCoachingInterest(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-teal-600"
          />
          I am open to mental health coaching for lower-severity concerns.
        </label>
      </fieldset>

      <label className="block rounded-2xl border border-gray-200 bg-white p-4">
        <span className="mb-1 block text-sm font-semibold text-gray-700">Additional notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-28 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          placeholder="Share anything that helps with provider matching."
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-200 transition-transform hover:-translate-y-0.5 ${isSubmitting ? "is-loading opacity-80" : ""}`}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isSubmitting ? "Submitting..." : "Submit assessment"}
        </button>
        <p className="inline-flex items-center gap-1 text-xs text-gray-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your responses remain private and role-restricted.
        </p>
      </div>

      {status && (
        <p className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{status}</p>
      )}
    </form>
  );
}
