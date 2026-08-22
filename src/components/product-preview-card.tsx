"use client";

import { useEffect, useState } from "react";
import type { ProductPreview } from "@/lib/metadata";
import { useTranslations } from "next-intl";
import { ProductLogo } from "./product-logo";

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
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(preview.name);
  const [editTagline, setEditTagline] = useState(preview.description ?? "");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4 border-t border-border/50 pt-5">
      <p className="flex items-center gap-2 text-sm font-medium text-success">
        <span>✓</span> {t("found")}
      </p>

      <div className="flex items-start gap-4">
        <ProductLogo
          name={preview.name}
          iconUrl={preview.icon}
          logoUrl={preview.logoUrl}
          faviconUrl={preview.faviconUrl}
          appleTouchIconUrl={preview.appleTouchIconUrl}
          ogImageUrl={preview.ogImage}
          domain={preview.domain}
          size={48}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-text">{showEdit ? editName : preview.name}</h3>
          <p className="text-sm text-text-dim">{preview.domain}</p>
          {(showEdit ? editTagline : preview.description) && (
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {showEdit ? editTagline : preview.description}
            </p>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-muted">
            {t("categoryLabel")}
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onEditCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-card px-3 py-2.5 text-sm text-text focus:border-gold focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showEdit && (
        <div className="space-y-3 border-t border-border/50 pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-dim">{t("productName")}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-dim">{t("taglineLabel")}</label>
            <input
              type="text"
              value={editTagline}
              onChange={(e) => setEditTagline(e.target.value)}
              maxLength={120}
              className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      )}

      {!showEdit && (
        <button
          onClick={() => setShowEdit(true)}
          className="text-xs text-text-dim transition-colors hover:text-text-muted"
        >
          {t("editHint")}
        </button>
      )}
    </div>
  );
}
