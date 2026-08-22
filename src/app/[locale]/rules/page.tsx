import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });
  return buildPageMetadata({
    title: t("rulesTitle"),
    description: t("rulesDesc"),
    path: `/${locale}/rules`,
    hreflangPath: "/rules",
  });
}

export default async function RulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="py-12">
      <RulesContent />
    </div>
  );
}

function RulesContent() {
  const t = useTranslations("app.rules");

  const rules = [
    t("rule1"),
    t("rule2"),
    t("rule3"),
    t("rule4"),
    t("rule5"),
    t("rule6"),
    t("rule7"),
  ];

  const legalLines = [t("legal1"), t("legal2"), t("legal3"), t("legal4"), t("legal5"), t("legal6")];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black">{t("title")}</h1>
      <p className="mt-2 text-lg text-text-muted">{t("subtitle")}</p>

      <div className="mt-10 rounded-xl border border-border bg-bg-card p-8">
        <ol className="space-y-4">
          {rules.map((rule, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                {i + 1}
              </span>
              <p className="pt-1 text-text-muted leading-relaxed">{rule}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-2 border-t border-border/40 pt-6">
          {legalLines.map((line) => (
            <p key={line} className="text-[11px] leading-relaxed text-text-dim">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
