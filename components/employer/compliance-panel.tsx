"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CompliancePanel() {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/compliance/audit-export");
      if (!response.ok) {
        toast.error("Failed to download audit report.");
        setIsDownloading(false);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "audit-export.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Audit report downloaded successfully.");
    } catch {
      toast.error("Failed to download audit report.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur">
      <h2 className="text-2xl font-semibold text-gray-900">Compliance reporting</h2>
      <p className="text-sm text-gray-600">
        Export audit logs for access reviews, operational controls, and compliance checks.
      </p>
      <button
        type="button"
        disabled={isDownloading}
        onClick={handleDownload}
        className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 ${isDownloading ? "is-loading opacity-80" : ""}`}
      >
        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isDownloading ? "Downloading..." : "Download audit CSV"}
      </button>
      <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
        Export includes action-level logs with actor, entity, timestamp, and metadata.
      </p>
    </div>
  );
}
