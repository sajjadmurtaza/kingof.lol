export type KingofBubbleVariant = "ivory" | "gem" | "lavender";

type KingofBubbleProps = {
  message: string;
  variant?: KingofBubbleVariant;
  tilt?: "left" | "right" | "none";
  className?: string;
};

export function KingofBubble({
  message,
  variant = "ivory",
  tilt = "none",
  className = "",
}: KingofBubbleProps) {
  const tiltClass =
    tilt === "left" ? "kingof-tilt-left" : tilt === "right" ? "kingof-tilt-right" : "";

  return (
    <div
      className={`kingof-bubble kingof-bubble--${variant} ${tiltClass} ${className}`.trim()}
    >
      <p className="kingof-bubble-brand">KINGOF</p>
      <p className="kingof-bubble-message">{message}</p>
    </div>
  );
}
