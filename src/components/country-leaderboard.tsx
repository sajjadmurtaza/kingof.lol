"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductLogo } from "@/components/product-logo";

type CountryProduct = {
  name: string;
  slug: string;
  tagline: string;
  clicks: number;
  categoryName: string;
  categoryEmoji: string;
  iconUrl: string | null;
  ogImageUrl: string | null;
  normalizedDomain: string;
};

type CountryOption = {
  code: string;
  flag: string;
  name: string;
};

type CountryData = {
  code: string;
  flag: string;
  name: string;
  products: CountryProduct[];
};

export function CountryLeaderboardClient({ locale }: { locale: string }) {
  const t = useTranslations("app.byCountry");
  const tUi = useTranslations("app.ui");
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [detected, setDetected] = useState<string | null>(null);
  const [data, setData] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/top-by-country")
      .then((r) => r.json())
      .then((res) => {
        setCountries(res.countries ?? []);
        const auto = res.detectedCountry as string | null;
        setDetected(auto);
        if (auto) {
          setSelected(auto);
        } else {
          setSelected("US");
        }
      })
      .catch(() => {
        setSelected("US");
      });
  }, []);

  const fetchCountry = useCallback((code: string) => {
    if (!code) return;
    setLoading(true);
    fetch(`/api/top-by-country?country=${code}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selected) fetchCountry(selected);
  }, [selected, fetchCountry]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelected(e.target.value);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-text">{t("title")}</h1>
        <p className="mt-2 text-text-muted">{t("subtitle")}</p>
      </div>

      {/* Country selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="country-select" className="text-sm font-medium text-text-muted">
          {t("selectCountry")}
        </label>
        <select
          id="country-select"
          value={selected}
          onChange={handleChange}
          className="rounded-lg border border-border bg-bg-card px-4 py-2.5 text-text outline-none transition-colors focus:border-gold sm:min-w-[280px]"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
              {c.code === detected ? ` (${t("yourCountry")})` : ""}
            </option>
          ))}
        </select>
        {detected && selected === detected && (
          <span className="text-xs text-text-dim">{t("autoDetected")}</span>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <span className="text-sm text-text-muted">{tUi("loading")}</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text">
            {data.flag}{" "}
            {t("topIn", { country: data.name })}
          </h2>

          {data.products.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {data.products.map((product, i) => (
                <Link
                  key={product.slug}
                  href={`/product/${product.slug}`}
                  locale={locale}
                  className={`product-panel group relative flex flex-col gap-3 rounded-xl border p-5 transition-all hover:border-border-bright ${
                    i === 0
                      ? "border-gold/40 bg-gradient-to-br from-gold/10 to-transparent shadow-[var(--shadow-gold)]"
                      : "border-border bg-bg-card"
                  }`}
                >
                  {/* Rank badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                        i === 0
                          ? "bg-gold/15 text-gold"
                          : i === 1
                            ? "bg-silver/10 text-silver"
                            : "bg-bronze/10 text-bronze"
                      }`}
                    >
                      #{i + 1}
                    </span>
                    <span className="text-xs text-text-dim">
                      {product.categoryEmoji} {product.categoryName}
                    </span>
                  </div>

                  {/* Product info */}
                  <div className="flex items-start gap-3">
                    <ProductLogo
                      name={product.name}
                      iconUrl={product.iconUrl}
                      ogImageUrl={product.ogImageUrl}
                      domain={product.normalizedDomain}
                      size={40}
                    />
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-text transition-colors group-hover:text-gold">
                        {product.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                        {product.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Clicks */}
                  <div className="mt-auto pt-2 text-sm font-medium text-text-dim">
                    {t("clicksLabel", { count: product.clicks.toLocaleString() })}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
              <p className="text-text-muted">
                {t("noData", { country: data.name })}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
