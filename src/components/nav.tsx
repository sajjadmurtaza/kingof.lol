"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function Nav({ locale }: { locale: string }) {
  const pathname = usePathname();
  return <NavBody key={pathname} locale={locale} pathname={pathname} />;
}

function NavBody({ locale, pathname }: { locale: string; pathname: string }) {
  const t = useTranslations("common.nav");
  const tt = useTranslations("common.theme");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const links = [
    { href: "/", label: t("overall") },
    { href: "/categories", label: t("categories") },
    { href: "/discover", label: t("discover") },
    { href: "/by-country", label: t("byCountry") },
    { href: "/how-it-works", label: t("howItWorks") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-2.5 sm:px-5">
        <Link
          href="/"
          locale={locale}
          className="font-display flex items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          <span className="text-gold">KINGOF</span>
          <span className="text-lg">👑</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              locale={locale}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === link.href ? "bg-gold/12 text-gold" : "text-text-muted hover:text-text"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/submit"
            locale={locale}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-on-gold transition-colors hover:bg-accent-hover"
          >
            {t("submit")}
          </Link>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text md:hidden"
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="17" y2="6" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 top-[57px] z-40 bg-[var(--overlay-scrim)] md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed right-0 top-[57px] z-50 h-[calc(100dvh-57px)] w-64 border-l border-border bg-bg transition-transform duration-200 ease-out md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-1 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              locale={locale}
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                pathname === link.href
                  ? "bg-surface text-gold"
                  : "text-text-muted hover:bg-surface hover:text-text"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="my-3 border-t border-border" />

          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-text-muted">{tt("label")}</span>
            <ThemeToggle />
          </div>

          <div className="my-3 border-t border-border" />

          <Link
            href="/most-clicked"
            locale={locale}
            onClick={() => setMenuOpen(false)}
            className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
              pathname === "/most-clicked"
                ? "bg-surface text-gold"
                : "text-text-muted hover:bg-surface hover:text-text"
            }`}
          >
            {t("mostClicked")}
          </Link>
          <Link
            href="/rules"
            locale={locale}
            onClick={() => setMenuOpen(false)}
            className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
              pathname === "/rules"
                ? "bg-surface text-gold"
                : "text-text-muted hover:bg-surface hover:text-text"
            }`}
          >
            {t("rules")}
          </Link>
        </div>
      </div>
    </header>
  );
}
