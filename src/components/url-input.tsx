"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

export function UrlInput({
  onSubmit,
  loading,
  autoFocus = false,
  compact = false,
}: {
  onSubmit: (url: string) => void;
  loading: boolean;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("app.onboard");
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-dim">
            🌐
          </span>
          <input
            ref={inputRef}
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full rounded-xl border border-border bg-bg-card py-3.5 pl-11 pr-4 text-text placeholder:text-text-dim focus:border-gold focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="shrink-0 rounded-xl bg-gold px-6 py-3.5 font-bold text-bg transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? <Spinner /> : "👑"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-text-dim">
          🌐
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("placeholder")}
          className="w-full rounded-2xl border-2 border-border bg-bg-card py-5 pl-14 pr-6 text-lg text-text placeholder:text-text-dim transition-colors focus:border-gold focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="w-full rounded-2xl bg-gold py-4 text-lg font-bold text-bg transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            {t("finding")}
          </span>
        ) : (
          t("findCta")
        )}
      </button>
      <p className="text-center text-sm text-text-dim">{t("hint")}</p>
    </form>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}
