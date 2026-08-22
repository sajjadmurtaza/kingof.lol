import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer({ locale }: { locale: string }) {
  const t = useTranslations("common");

  return (
    <footer className="border-t border-border bg-bg-card mt-20">
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <Link
              href="/"
              locale={locale}
              className="text-lg font-black text-gold"
            >
              KINGOF
            </Link>
            <p className="mt-1 text-sm text-text-muted">{t("footer.tagline")}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
            <Link href="/categories" locale={locale} className="hover:text-text">
              {t("nav.categories")}
            </Link>
            <Link href="/discover" locale={locale} className="hover:text-text">
              {t("nav.discover")}
            </Link>
            <Link href="/by-country" locale={locale} className="hover:text-text">
              {t("nav.byCountry")}
            </Link>
            <Link href="/how-it-works" locale={locale} className="hover:text-text">
              {t("nav.howItWorks")}
            </Link>
            <Link href="/rules" locale={locale} className="hover:text-text">
              {t("nav.rules")}
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-text-dim">
          &copy; {new Date().getFullYear()} KINGOF. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
