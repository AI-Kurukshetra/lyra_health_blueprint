"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface TriageResult {
  urgency: "critical" | "routine";
  escalated: boolean;
  suggestions: string[];
  nextActions: string[];
}

export function ChatbotTriagePanel() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function runTriage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("Analyzing message...");
    setIsAnalyzing(true);

    const response = await fetch("/api/chatbot/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const payload = (await response.json().catch(() => null)) as {
      data?: TriageResult;
      error?: string;
    };

    if (!response.ok || !payload?.data) {
      const triageError = payload?.error ?? "Triage request failed.";
      setStatusMessage(triageError);
      toast.error(triageError);
      setIsAnalyzing(false);
      return;
    }

    setResult(payload.data);
    setStatusMessage(
      payload.data.escalated
        ? "Critical concern detected. Follow escalation actions now."
        : "Triage complete. Follow suggestions below.",
    );
    if (payload.data.escalated) {
      toast.warning("Critical concern detected. Escalation is recommended.");
    } else {
      toast.success("Triage completed successfully.");
    }
    setIsAnalyzing(false);
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={runTriage}
        className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-600">
          <Sparkles className="h-3.5 w-3.5" />
          AI Chatbot Triage
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-gray-900">Share how you feel</h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter a short note to receive urgency detection, guidance, and next actions.
        </p>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Message</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            minLength={4}
            className="min-h-28 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            placeholder="Example: I'm feeling overwhelmed and anxious about work this week..."
          />
        </label>

        <button
          type="submit"
          disabled={isAnalyzing}
          className={`mt-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 ${isAnalyzing ? "is-loading opacity-80" : ""}`}
        >
          {isAnalyzing ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </span>
          ) : (
            "Analyze and guide"
          )}
        </button>
      </form>

      {result && (
        <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Triage output</h3>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                result.urgency === "critical"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {result.urgency}
            </span>
          </div>

          {result.escalated && (
            <p className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              <AlertTriangle className="h-4 w-4" />
              Escalation recommended.
            </p>
          )}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">Suggestions</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {result.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Next actions</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cyan-900">
              {result.nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
        {statusMessage ?? "Triage assistant is ready."}
      </p>
    </div>
  );
}
