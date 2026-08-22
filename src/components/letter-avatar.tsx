import { siteLabelForAvatar } from "@/lib/format";

export function LetterAvatar({
  name,
  domain,
  size = 48,
  className = "",
  rounded = "lg",
}: {
  name: string;
  domain?: string | null;
  size?: number;
  className?: string;
  rounded?: "full" | "lg" | "md";
}) {
  const { text, fontSize } = siteLabelForAvatar(name, domain, size);
  const radius =
    rounded === "full" ? "rounded-full" : rounded === "md" ? "rounded-md" : "rounded-lg";

  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-border bg-bg-elevated text-center font-semibold leading-none text-text-muted ${radius} ${className}`}
      style={{ width: size, height: size }}
      title={domain ?? name}
      aria-hidden
    >
      <span
        className={`max-w-[92%] truncate px-0.5 tracking-tight ${text.length <= 3 ? "uppercase" : "lowercase"}`}
        style={{ fontSize }}
      >
        {text}
      </span>
    </div>
  );
}
