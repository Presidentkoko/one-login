"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";

/** Counts smoothly from the old value to the new one, so money visibly lands. */
export function AnimatedMoney({ cents, className }: { cents: number; className?: string }) {
  const [shown, setShown] = useState(cents);
  const from = useRef(cents);

  useEffect(() => {
    const start = from.current;
    if (start === cents) return;
    const began = performance.now();
    const duration = 750;
    let frame = 0;

    const tick = (t: number) => {
      const p = Math.min(1, (t - began) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      const value = Math.round(start + (cents - start) * eased);
      from.current = value;
      setShown(value);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cents]);

  return <span className={`tabular ${className ?? ""}`}>{formatMoney(shown, { forceWhole: true })}</span>;
}
