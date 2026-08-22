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
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium text-success">
        <span>✓</span> {t("found")}
      </p>

      <div className="rounded-2xl border border-border bg-bg-card p-5">
        {/* Product identity */}
        <div className="flex items-start gap-3">
          {preview.icon ? (
            <img
              src={preview.icon}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg bg-surface object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <LetterAvatar name={preview.name} size={40} />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-text">{showEdit ? editName : preview.name}</h3>
            <p className="text-sm text-text-dim">{preview.domain}</p>
          </div>
        </div>

        {/* Description */}
        {(showEdit ? editTagline : preview.description) && (
          <p className="mt-3 text-sm text-text-muted leading-relaxed">
            {showEdit ? editTagline : preview.description}
          </p>
        )}

        {/* Category — single dropdown */}
        {categories.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-text-dim">
              Category
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => onEditCategory(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-gold focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Inline edit fields */}
        {showEdit && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-dim">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-dim">Tagline</label>
              <input
                type="text"
                value={editTagline}
                onChange={(e) => setEditTagline(e.target.value)}
                maxLength={120}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Edit toggle */}
      {!showEdit && (
        <button
          onClick={() => setShowEdit(true)}
          className="text-xs text-text-dim hover:text-text-muted transition-colors"
        >
          Something wrong? Edit details
        </button>
      )}
    </div>
  );
}
