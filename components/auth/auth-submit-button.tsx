"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface AuthSubmitButtonProps {
  label: string;
  pendingLabel: string;
}

export function AuthSubmitButton({ label, pendingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-[0_12px_30px_-12px_rgba(14,116,144,0.65)] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60 ${pending ? "is-loading" : ""}`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingLabel : label}
    </button>
  );
}
