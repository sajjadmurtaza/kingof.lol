import type { ReactNode } from "react";

export function Section({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div>
        <h2 className="text-lg font-bold text-text">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-text-dim">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
