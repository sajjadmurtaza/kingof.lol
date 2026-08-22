import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });
  return buildPageMetadata({
    title: t("outbidTitle"),
    absoluteTitle: true,
    description: t("outbidDesc"),
    path: `/${locale}/outbid-alternative`,
    hreflangPath: "/outbid-alternative",
  });
}

export default async function OutbidAlternativePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <article className="mx-auto max-w-3xl py-12">
      <OutbidAlternativeContent locale={locale} />
    </article>
  );
}

function OutbidAlternativeContent({ locale }: { locale: string }) {
  const t = useTranslations("app.outbidAlt");

  const discoveryItems = [
    { label: t("mostClickedLabel"), desc: t("mostClickedDesc") },
    { label: t("risingLabel"), desc: t("risingDesc") },
    { label: t("randomLabel"), desc: t("randomDesc") },
    { label: t("gemsLabel"), desc: t("gemsDesc") },
    { label: t("geoLabel"), desc: t("geoDesc") },
  ];

  const comparisonRows: [string, string, string][] = [
    [t("rowCategoryLabel"), t("rowCategoryKingof"), t("rowCategoryOutbid")],
    [t("rowFreeLabel"), t("rowFreeKingof"), t("rowFreeOutbid")],
    [t("rowDiscoveryLabel"), t("rowDiscoveryKingof"), t("rowDiscoveryOutbid")],
    [t("rowMinBidLabel"), t("rowMinBidKingof"), t("rowMinBidOutbid")],
    [t("rowGeoLabel"), t("rowGeoKingof"), t("rowGeoOutbid")],
  ];

  return (
    <>
      <h1 className="text-3xl font-black sm:text-4xl">{t("title")}</h1>
      <p className="mt-4 text-lg text-text-muted leading-relaxed">{t("intro")}</p>

      <div className="mt-12 space-y-10">
        <section>
          <h2 className="text-xl font-bold">{t("whatIsHeading")}</h2>
          <p className="mt-2 text-text-muted leading-relaxed">{t("whatIsBody")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t("rankingHeading")}</h2>
          <p className="mt-2 text-text-muted leading-relaxed">{t("rankingBody")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t("categoriesHeading")}</h2>
          <p className="mt-2 text-text-muted leading-relaxed">{t("categoriesBody")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t("freeHeading")}</h2>
          <p className="mt-2 text-text-muted leading-relaxed">{t("freeBody")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t("discoveryHeading")}</h2>
          <p className="mt-2 text-text-muted leading-relaxed">{t("discoveryIntro")}</p>
          <ul className="mt-3 space-y-2 text-text-muted">
            {discoveryItems.map((item) => (
              <li key={item.label} className="flex gap-3">
                <span className="font-bold text-text">{item.label}</span>
                <span>— {item.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t("biddingHeading")}</h2>
          <p className="mt-2 text-text-muted leading-relaxed">{t("biddingBody")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t("submissionHeading")}</h2>
          <p className="mt-2 text-text-muted leading-relaxed">{t("submissionBody")}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t("comparisonHeading")}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 font-bold text-text">{t("colFeature")}</th>
                  <th className="pb-3 pr-4 font-bold text-gold">{t("colKingof")}</th>
                  <th className="pb-3 font-bold text-text-muted">{t("colOutbid")}</th>
                </tr>
              </thead>
              <tbody className="text-text-muted">
                {comparisonRows.map(([label, kingof, outbid]) => (
                  <tr key={label} className="border-b border-border/50">
                    <td className="py-3 pr-4 text-text">{label}</td>
                    <td className="py-3 pr-4">{kingof}</td>
                    <td className="py-3">{outbid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t("tryHeading")}</h2>
          <p className="mt-2 text-text-muted leading-relaxed">{t("tryBody")}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/submit"
              locale={locale}
              className="rounded-xl bg-gold px-8 py-3 text-center font-bold text-bg transition-colors hover:bg-accent-hover"
            >
              {t("ctaSubmit")}
            </Link>
            <Link
              href="/"
              locale={locale}
              className="rounded-xl border border-border px-8 py-3 text-center font-medium text-text transition-colors hover:border-border-bright"
            >
              {t("ctaExplore")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
