/** Placa de PARE: octógono vermelho com borda branca. */
export function StopOctagon({
  size,
  label,
  className,
}: {
  size: number;
  label?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={label ?? "Stop"}
    >
      <polygon
        points="30,2 70,2 98,30 98,70 70,98 30,98 2,70 2,30"
        fill="#ffffff"
        stroke="#1b0b3a"
        strokeWidth="3"
      />
      <polygon points="32,9 68,9 91,32 91,68 68,91 32,91 9,68 9,32" fill="#e5262c" />
      <polygon points="32,9 68,9 91,32 91,50 9,50 9,32" fill="#ffffff" opacity="0.12" />
      {label ? (
        <text
          x="50"
          y="50"
          dy="0.36em"
          textAnchor="middle"
          fontFamily="Lilita One, sans-serif"
          fontSize={label.length > 4 ? 22 : 28}
          fill="#ffffff"
          transform="rotate(-6 50 50)"
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
}
