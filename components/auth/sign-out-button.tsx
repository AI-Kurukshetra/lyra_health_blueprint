"use client";

import { useFormStatus } from "react-dom";
import { Loader2, LogOut } from "lucide-react";

function SignOutInner() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 ${pending ? "is-loading opacity-80" : ""}`}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}

interface SignOutButtonProps {
  action: () => Promise<void>;
}

export function SignOutButton({ action }: SignOutButtonProps) {
  return (
    <form action={action}>
      <SignOutInner />
    </form>
  );
}
