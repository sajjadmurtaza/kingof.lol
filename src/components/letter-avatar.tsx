const COLORS = [
  "#374151",
  "#4b5563",
  "#6b7280",
  "#52525b",
  "#44403c",
  "#57534e",
  "#525252",
  "#404040",
];

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function LetterAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const letter = name.charAt(0).toUpperCase();
  const color = COLORS[hashStr(name) % COLORS.length];

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg font-medium text-white/80"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.42,
      }}
    >
      {letter}
    </div>
  );
}
