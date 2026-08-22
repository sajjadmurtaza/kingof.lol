import Link from "next/link";
import enApp from "@/i18n/locales/en/app.json";

export default function NotFound() {
  const t = enApp.notFound;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg font-sans text-text">
      <div className="px-8 text-center">
        <h1 className="text-6xl font-black text-gold">404</h1>
        <p className="mt-2 text-lg text-text-muted">{t.body}</p>
        <Link
          href="/en"
          className="mt-8 inline-block rounded-xl bg-gold px-8 py-3 font-bold text-on-gold transition-colors hover:bg-accent-hover"
        >
          {t.cta}
        </Link>
      </div>
    </div>
  );
}
