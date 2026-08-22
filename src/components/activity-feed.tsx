import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ActivityItem } from "@/domains/leaderboard/queries";

export function ActivityFeed({
  activities,
  locale,
}: {
  activities: ActivityItem[];
  locale: string;
}) {
  const t = useTranslations("app.sections");

  if (activities.length === 0) return null;

  return (
    <section className="space-y-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
        {t("happeningNow")}
      </h2>
      <div className="space-y-3">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="min-w-0 truncate text-sm text-text">{activity.message}</span>
            <span className="shrink-0 text-xs text-text-dim">{activity.timeAgo}</span>
          </div>
        ))}
      </div>
      <Link
        href="/discover"
        locale={locale}
        className="inline-block text-sm text-text-muted transition-colors hover:text-text"
      >
        {t("viewActivity")}
      </Link>
    </section>
  );
}
