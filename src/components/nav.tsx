"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function Nav({ locale }: { locale: string }) {
  const t = useTranslations("common.nav");
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("overall") },
    { href: "/categories", label: t("categories") },
    { href: "/discover", label: t("discover") },
    { href: "/how-it-works", label: t("howItWorks") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3">
        <Link href="/" locale={locale} className="flex items-center gap-2 text-xl font-black">
          <span className="text-gold">KINGOF</span>
          <span className="text-lg">👑</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              locale={locale}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-surface text-gold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/submit"
          locale={locale}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-bg transition-colors hover:bg-accent-hover"
        >
          {t("submit")}
        </Link>
      </nav>
    </header>
  );
}
