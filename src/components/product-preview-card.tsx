"use client";

import { useEffect, useState } from "react";
import type { ProductPreview } from "@/lib/metadata";
import { useTranslations } from "next-intl";
import { LetterAvatar } from "./letter-avatar";

type Category = { slug: string; name: string; emoji: string };

export function ProductPreviewCard({
  preview,
  onEditCategory,
  selectedCategory,
}: {
  preview: ProductPreview;
  onEditCategory: (slug: string) => void;
  selectedCategory: string;
}) {
  const t = useTranslations("app.onboard");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm font-medium text-success">
        <span>✓</span> {t("found")}
      </p>

      <div className="rounded-2xl border border-border bg-bg-card p-6">
        <div className="flex items-start gap-4">
          {preview.icon ? (
            <img
              src={preview.icon}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl bg-surface object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          {!preview.icon && <LetterAvatar name={preview.name} size={48} />}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-text">{preview.name}</h3>
            <p className="text-sm text-text-dim">{preview.domain}</p>
          </div>
        </div>

        {preview.description && (
          <p className="mt-3 text-sm text-text-muted leading-relaxed">{preview.description}</p>
        )}

        {categories.length > 0 && (
          <div className="mt-4">
            <select
              value={selectedCategory}
              onChange={(e) => onEditCategory(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text focus:border-gold focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
