import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "app.notFound" });

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-black text-gold">404</h1>
      <p className="mt-3 text-lg text-text-muted">{t("body")}</p>
      <Link
        href="/"
        locale={locale}
        className="mt-8 inline-block rounded-xl bg-gold px-8 py-3 font-bold text-on-gold transition-colors hover:bg-accent-hover"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
