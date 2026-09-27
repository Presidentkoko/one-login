"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatMoney, parseMoney } from "@/lib/money";

export type NewEntry = { customer: string | null; description: string; amount_cents: number };

type Props = {
  kind: "in" | "out";
  suggestions: { customers: string[]; jobs: string[] };
  onClose: () => void;
  onSave: (entry: NewEntry) => void;
};

const COST_PRESETS = ["Materials", "Fuel", "Tools", "Subbie", "Wages"];

export function EntrySheet({ kind, suggestions, onClose, onSave }: Props) {
  const isJob = kind === "in";
  const [customer, setCustomer] = useState("");
  const [job, setJob] = useState("");
  const [price, setPrice] = useState("");
  const jobRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const keyboardOffset = useKeyboardOffset();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cents = parseMoney(price);
  const ready = cents > 0 && (isJob ? customer.trim().length > 0 : true);
  const jobChips = isJob ? suggestions.jobs : unique([...suggestions.jobs, ...COST_PRESETS]).slice(0, 6);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    onSave({
      customer: isJob ? customer.trim() : null,
      description: job.trim() || (isJob ? "Job" : "Cost"),
      amount_cents: cents,
    });
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label={isJob ? "Job done" : "Money out"}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px] animate-fade-in"
      />

      <form
        onSubmit={submit}
        style={{ bottom: keyboardOffset }}
        className="absolute inset-x-0 mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-[32px] border-t border-line bg-panel px-5 pt-3 pb-safe shadow-[0_-30px_80px_-20px_rgb(0_0_0/0.8)] animate-sheet-up"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />

        <div className="flex items-center justify-between">
          <h2 className="text-[26px] font-semibold tracking-tight">
            {isJob ? "Job done" : "Money out"}
            <span className={isJob ? "text-black-in" : "text-red-out"}>.</span>
          </h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-2 text-[15px] text-muted active:text-fg">
            Cancel
          </button>
        </div>

        {isJob && (
          <Field label="Customer">
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), jobRef.current?.focus())}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="next"
              maxLength={120}
              placeholder="Who was it for?"
              className={inputClass}
            />
            <Chips items={suggestions.customers} active={customer} onPick={(v) => { setCustomer(v); jobRef.current?.focus(); }} />
          </Field>
        )}

        <Field label={isJob ? "Job" : "What for"}>
          <input
            ref={jobRef}
            value={job}
            onChange={(e) => setJob(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), priceRef.current?.focus())}
            autoComplete="off"
            autoCapitalize="sentences"
            enterKeyHint="next"
            maxLength={200}
            placeholder={isJob ? "e.g. Hot water system swap" : "e.g. Copper fittings"}
            className={inputClass}
          />
          <Chips items={jobChips} active={job} onPick={(v) => { setJob(v); priceRef.current?.focus(); }} />
        </Field>

        <Field label={isJob ? "Price" : "Amount"}>
          <div className="flex items-baseline gap-1">
            <span className={`text-[40px] font-semibold ${cents ? "text-fg" : "text-white/25"}`}>$</span>
            <input
              ref={priceRef}
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.,]/g, ""))}
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              placeholder="0"
              aria-label={isJob ? "Price" : "Amount"}
              className="tabular w-full bg-transparent text-[44px] leading-none font-semibold tracking-tight outline-none placeholder:text-white/20"
            />
          </div>
        </Field>

        <button
          type="submit"
          disabled={!ready}
          className={`mt-6 mb-2 flex h-[64px] w-full items-center justify-center gap-2 rounded-[22px] text-[19px] font-semibold transition active:scale-[0.98] disabled:opacity-35 disabled:shadow-none ${
            isJob
              ? "bg-gradient-to-b from-[#4ff3b4] to-black-in-deep text-[#03140c] shadow-[0_14px_36px_-12px_rgb(46_230_160/0.75),inset_0_1px_0_rgb(255_255_255/0.4)]"
              : "bg-gradient-to-b from-[#ff7b7f] to-[#e2434a] text-white shadow-[0_14px_36px_-12px_rgb(255_93_98/0.7),inset_0_1px_0_rgb(255_255_255/0.3)]"
          }`}
        >
          {isJob ? "Add to money in" : "Add to money out"}
          {cents > 0 && <span className="tabular opacity-80">· {formatMoney(cents)}</span>}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "block w-full bg-transparent text-[20px] font-medium outline-none placeholder:font-normal placeholder:text-white/25";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="card mt-3 block rounded-[22px] px-4 pt-3 pb-3 transition focus-within:border-white/20">
      <span className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
    </label>
  );
}

function Chips({ items, active, onPick }: { items: string[]; active: string; onPick: (v: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[14px] transition active:scale-95 ${
            item === active ? "border-black-in/60 bg-black-in/15 text-fg" : "border-line bg-white/[0.04] text-muted"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function unique(items: string[]) {
  return [...new Set(items)];
}

/** iOS keeps fixed elements behind the keyboard; lift the sheet above it. */
function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setOffset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return offset;
}
