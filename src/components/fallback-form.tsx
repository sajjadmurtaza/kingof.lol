"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

type Category = { slug: string; name: string; emoji: string };

export function FallbackForm({
  url,
  domain,
  onComplete,
}: {
  url: string;
  domain: string;
  onComplete: (data: {
    name: string;
    tagline: string;
    category: string;
  }) => void;
}) {
  const t = useTranslations("app.onboard");
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((cats: Category[]) => {
        setCategories(cats);
        if (cats.length > 0 && !category) setCategory(cats[0].slug);
      })
      .catch(() => {});
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onComplete({ name: name.trim(), tagline: tagline.trim(), category });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-bg-card p-4">
        <p className="flex items-center gap-2 text-sm text-success">
          <span>✓</span> {t("siteFound")}
        </p>
        <p className="mt-1 text-sm text-text-muted">{domain}</p>
      </div>

      <p className="text-sm text-text-muted">{t("couldntFindDetails")}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text">
            {t("productName")}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-card px-4 py-3 text-text placeholder:text-text-dim focus:border-gold focus:outline-none"
            placeholder={t("productNamePlaceholder")}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">
            {t("taglineLabel")}
          </label>
          <input
            type="text"
            maxLength={100}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-card px-4 py-3 text-text placeholder:text-text-dim focus:border-gold focus:outline-none"
            placeholder={t("taglinePlaceholder")}
          />
        </div>

        {categories.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              {t("categoryLabel")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-card px-4 py-3 text-text focus:border-gold focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-gold py-3 font-bold text-bg transition-colors hover:bg-accent-hover"
        >
          {t("continueBtn")}
        </button>
      </form>
    </div>
  );
}
