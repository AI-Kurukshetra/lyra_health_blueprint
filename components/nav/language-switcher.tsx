"use client";

import { useEffect, useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: Record<string, unknown>,
          containerId: string,
        ) => unknown;
      };
    };
  }
}

const supportedLanguages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "hi", label: "Hindi" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
  { value: "ja", label: "Japanese" },
];

function setGoogleTranslateCookie(language: string) {
  const cookieValue = `/en/${language}`;
  document.cookie = `googtrans=${cookieValue};path=/`;
  document.cookie = `googtrans=${cookieValue};path=/;domain=${window.location.hostname}`;
}

export function LanguageSwitcher() {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    return window.localStorage.getItem("preferred-language") ?? "en";
  });
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) {
        return;
      }
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
          includedLanguages: supportedLanguages.map((entry) => entry.value).join(","),
        },
        "google_translate_element",
      );
    };

    const existingScript = document.getElementById("google-translate-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.googleTranslateElementInit) {
      window.googleTranslateElementInit();
    }
  }, []);

  function applyLanguage(nextLanguage: string) {
    setIsApplying(true);
    setLanguage(nextLanguage);
    window.localStorage.setItem("preferred-language", nextLanguage);
    setGoogleTranslateCookie(nextLanguage);
    document.documentElement.lang = nextLanguage;

    const languageLabel = supportedLanguages.find((entry) => entry.value === nextLanguage)?.label ?? nextLanguage;

    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (select) {
      select.value = nextLanguage;
      select.dispatchEvent(new Event("change"));
      window.setTimeout(() => {
        setIsApplying(false);
        toast.success(`Language switched to ${languageLabel}.`);
      }, 400);
      return;
    }

    toast.info(`Switching to ${languageLabel}...`);
    window.location.reload();
  }

  return (
    <>
      <div id="google_translate_element" className="sr-only" />
      <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-700">
        {isApplying ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" />
        ) : (
          <Languages className="h-3.5 w-3.5 text-teal-700" />
        )}
        <span className="hidden font-semibold sm:inline">Language</span>
        <select
          value={language}
          onChange={(event) => applyLanguage(event.target.value)}
          className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs font-medium outline-none focus:border-teal-500"
          disabled={isApplying}
        >
          {supportedLanguages.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
