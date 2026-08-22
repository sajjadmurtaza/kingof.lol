"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { formatBid } from "@/lib/format";
import { confirmPaymentSession } from "@/lib/payment-confirmation";

type PageState =
  | { phase: "loading" }
  | { phase: "success"; slug: string; bidAmountCents: number; totalBidCents: number }
  | { phase: "error"; message: string };

function PaymentSuccessConfirm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [state, setState] = useState<PageState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const result = await confirmPaymentSession(sessionId);
      if (cancelled) return;

      if ("error" in result) {
        setState({ phase: "error", message: result.error });
        return;
      }

      setState({
        phase: "success",
        slug: result.slug,
        bidAmountCents: result.bidAmountCents,
        totalBidCents: result.totalBidCents,
      });

      window.setTimeout(() => {
        router.push(`/product/${result.slug}?listed=1`);
      }, 2000);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return <PaymentSuccessView state={state} />;
}

function PaymentSuccessView({ state }: { state: PageState }) {
  const t = useTranslations("app.paymentSuccess");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        {state.phase === "loading" ? (
          <>
            <p className="text-4xl" aria-hidden="true">
              👑
            </p>
            <h1 className="mt-4 text-2xl font-black text-text">{t("confirmingTitle")}</h1>
            <p className="mt-2 text-text-muted">{t("confirmingDesc")}</p>
            <p className="mt-6 inline-block h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </>
        ) : null}

        {state.phase === "success" ? (
          <>
            <p className="text-4xl" aria-hidden="true">
              ✅
            </p>
            <h1 className="mt-4 text-2xl font-black text-gold">{t("successTitle")}</h1>
            <p className="mt-2 text-text-muted">
              {t("successDesc", { amount: formatBid(state.totalBidCents) })}
            </p>
            <p className="mt-4 text-sm text-text-dim">{t("redirecting")}</p>
          </>
        ) : null}

        {state.phase === "error" ? (
          <>
            <h1 className="text-2xl font-black text-text">{t("errorTitle")}</h1>
            <p className="mt-2 text-text-muted">{state.message}</p>
            <p className="mt-4 text-sm text-text-dim">{t("errorHint")}</p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-xl bg-gold px-6 py-3 font-bold text-on-gold hover:bg-accent-hover"
            >
              {t("backToBoard")}
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  const t = useTranslations("app.paymentSuccess");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return (
      <PaymentSuccessView
        state={{ phase: "error", message: t("missingSession") }}
      />
    );
  }

  return <PaymentSuccessConfirm sessionId={sessionId} />;
}
