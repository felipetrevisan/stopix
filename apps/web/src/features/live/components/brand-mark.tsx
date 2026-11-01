/** Marca do Stopix: cronômetro em degradê (verde-água → azul → roxo) com um S. */
export function BrandMark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Stopix"
    >
      <defs>
        <linearGradient id="stopix-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="55%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#stopix-mark)" />
      <rect x="27" y="6" width="10" height="5" rx="2" fill="#fff" opacity="0.9" />
      <circle
        cx="32"
        cy="35"
        r="19"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.3"
        strokeWidth="4"
      />
      <path
        d="M32 16 A19 19 0 1 1 13.9 41"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text
        x="32"
        y="35"
        dy="0.36em"
        textAnchor="middle"
        fontFamily="Rubik Variable, Rubik, sans-serif"
        fontWeight="900"
        fontSize="22"
        fill="#fff"
      >
        S
      </text>
    </svg>
  );
}

/** Logo com nome, para o topo do palco e do painel. */
export function BrandLogo({
  size = 34,
  textClass = "text-[22px]",
}: {
  size?: number;
  textClass?: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <BrandMark size={size} />
      <span className={`grad-text font-black tracking-tight italic ${textClass}`}>STOPIX</span>
    </span>
  );
}
