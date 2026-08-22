"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function EmailStep({
  onSubmit,
  loading,
}: {
  onSubmit: (email: string) => void;
  loading: boolean;
}) {
  const t = useTranslations("app.onboard");
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmit(email.trim());
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-text-muted">{t("almostThere")}</p>
      <p className="text-sm text-text-dim">{t("emailExplainer")}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border-2 border-border bg-bg-card py-4 px-5 text-text placeholder:text-text-dim focus:border-gold focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full rounded-xl bg-gold py-4 font-bold text-on-gold transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            t("continueBtn")
          )}
        </button>
      </form>
    </div>
  );
}
