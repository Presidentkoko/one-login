export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5cf5bb" />
          <stop offset="1" stopColor="#0fbf7a" />
        </linearGradient>
      </defs>
      <path
        d="M20 3.5 34 8.6v10.2c0 8.6-5.8 15.2-14 17.7C11.8 34 6 27.4 6 18.8V8.6L20 3.5Z"
        fill="url(#logo-g)"
      />
      <path
        d="m13.6 20.2 4.6 4.6 8.4-9.2"
        fill="none"
        stroke="#04130c"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
