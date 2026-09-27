"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatedMoney } from "@/components/AnimatedMoney";
import { EntrySheet, type NewEntry } from "@/components/EntrySheet";
import { Logo } from "@/components/Logo";
import {
  daysLeft,
  formatMoney,
  monthKey,
  monthName,
  shortDay,
  totals,
  type Entry,
} from "@/lib/money";
import { createClient } from "@/lib/supabase/client";

const COLUMNS = "id, kind, customer, description, amount_cents, created_at";

type Toast = { id: number; text: string; tone: "in" | "out" | "error"; undoId?: string };

export function Dashboard({
  initialEntries,
  nowIso,
  email,
}: {
  initialEntries: Entry[];
  nowIso: string;
  email: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState(initialEntries);
  const [now, setNow] = useState(nowIso);
  const [sheet, setSheet] = useState<"in" | "out" | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heroRef = useRef<HTMLDivElement>(null);

  // A little "thunk" on the big number whenever money moves.
  useEffect(() => {
    if (pulse === 0) return;
    heroRef.current?.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.07)" }, { transform: "scale(1)" }],
      { duration: 550, easing: "cubic-bezier(0.2, 1.4, 0.4, 1)" },
    );
  }, [pulse]);

  const month = monthKey(now);
  const thisMonth = useMemo(() => entries.filter((e) => monthKey(e.created_at) === month), [entries, month]);
  const { moneyIn, moneyOut, profit } = totals(thisMonth);

  const suggestions = useMemo(() => {
    const pick = (kind: Entry["kind"], field: "customer" | "description") =>
      [...new Set(entries.filter((e) => e.kind === kind).map((e) => e[field]?.trim()).filter(Boolean) as string[])].slice(0, 6);
    return {
      in: { customers: pick("in", "customer"), jobs: pick("in", "description") },
      out: { customers: [], jobs: pick("out", "description") },
    };
  }, [entries]);

  // Coming back to the app (or from another phone) should always show the truth.
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      const since = new Date(Date.now() - 32 * 86_400_000).toISOString();
      const { data } = await supabase
        .from("entries")
        .select(COLUMNS)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      setNow(new Date().toISOString());
      if (data) setEntries((prev) => [...prev.filter((e) => e.id.startsWith("temp-")), ...(data as Entry[])]);
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [supabase]);

  const showToast = useCallback((t: Omit<Toast, "id">) => {
    clearTimeout(toastTimer.current);
    setToast({ ...t, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const closeSheet = useCallback(() => setSheet(null), []);

  async function add(kind: Entry["kind"], fields: NewEntry) {
    const temp: Entry = { id: `temp-${crypto.randomUUID()}`, kind, ...fields, created_at: new Date().toISOString() };
    setEntries((prev) => [temp, ...prev]);
    setSheet(null);
    setPulse((p) => p + 1);
    buzz(kind === "in" ? [10, 40, 18] : 12);

    const { data, error } = await supabase
      .from("entries")
      .insert({ kind, ...fields })
      .select(COLUMNS)
      .single();

    if (error || !data) {
      setEntries((prev) => prev.filter((e) => e.id !== temp.id));
      setPulse((p) => p + 1);
      showToast({ text: "Didn't save. Check your signal and try again.", tone: "error" });
      return;
    }
    setEntries((prev) => prev.map((e) => (e.id === temp.id ? (data as Entry) : e)));
    showToast({
      text:
        kind === "in"
          ? `${formatMoney(fields.amount_cents)} in · ${fields.customer}`
          : `${formatMoney(fields.amount_cents)} out · ${fields.description}`,
      tone: kind,
      undoId: data.id,
    });
  }

  async function remove(id: string) {
    const removed = entries.find((e) => e.id === id);
    if (!removed) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setOpenRow(null);
    setPulse((p) => p + 1);
    buzz(8);

    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) {
      setEntries((prev) => [removed, ...prev].sort((a, b) => b.created_at.localeCompare(a.created_at)));
      showToast({ text: "Couldn't remove that. Try again.", tone: "error" });
    } else {
      showToast({ text: "Removed.", tone: removed.kind });
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const status =
    thisMonth.length === 0 ? "fresh" : profit > 0 ? "black" : "red";
  const tone = {
    fresh: { text: "text-fg", glow: "rgb(255 255 255 / 0.08)", label: "Fresh month. Let's fill it." },
    black: { text: "text-black-in", glow: "rgb(46 230 160 / 0.30)", label: "In the black" },
    red: { text: "text-red-out", glow: "rgb(255 93 98 / 0.30)", label: profit === 0 ? "Breaking even" : "In the red" },
  }[status];
  const margin = moneyIn > 0 ? Math.round((profit / moneyIn) * 100) : null;
  const left = daysLeft(now);

  return (
    <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-40">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[70vh] transition-[background] duration-700"
        style={{ background: `radial-gradient(70% 55% at 50% 12%, ${tone.glow}, transparent 70%)` }}
      />

      {/* Header */}
      <header className="relative flex items-center justify-between animate-rise">
        <div className="flex items-center gap-2.5">
          <Logo className="size-8" />
          <span className="text-[17px] font-semibold tracking-tight">One Login</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account"
            className="card flex size-10 items-center justify-center rounded-full text-[15px] font-semibold uppercase"
          >
            {email.slice(0, 1) || "•"}
          </button>
          {menuOpen && (
            <>
              <button aria-label="Close menu" className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-line bg-panel/95 p-2 shadow-2xl backdrop-blur-xl animate-fade-in">
                <p className="truncate px-3 pt-2 pb-3 text-[13px] text-muted">{email}</p>
                <button onClick={signOut} className="w-full rounded-xl px-3 py-3 text-left text-[15px] font-medium active:bg-white/5">
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* The number */}
      <section className="relative mt-10 text-center animate-rise [animation-delay:50ms]">
        <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-muted">
          {monthName(now)} · profit
        </p>
        <div ref={heroRef} className={`mt-3 ${tone.text} transition-colors duration-500`}>
          <AnimatedMoney
            cents={profit}
            className="block text-[clamp(56px,17vw,84px)] leading-none font-semibold tracking-[-0.045em]"
          />
        </div>
        <div className="mt-5 flex items-center justify-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors duration-500 ${
              status === "black"
                ? "border-black-in/30 bg-black-in/10 text-black-in"
                : status === "red"
                  ? "border-red-out/30 bg-red-out/10 text-red-out"
                  : "border-line bg-white/5 text-muted"
            }`}
          >
            {status !== "fresh" && <span className="size-1.5 rounded-full bg-current" />}
            {tone.label}
          </span>
          <span className="text-[13px] text-muted">
            {left} {left === 1 ? "day" : "days"} left
          </span>
        </div>
      </section>

      {/* In / out */}
      <section className="relative mt-9 grid grid-cols-2 gap-3 animate-rise [animation-delay:100ms]">
        <Tile label="Money in" cents={moneyIn} tone="in" onClick={() => setSheet("in")} hint="Job done" />
        <Tile label="Money out" cents={moneyOut} tone="out" onClick={() => setSheet("out")} hint="Add cost" />
      </section>

      {moneyIn > 0 && (
        <div className="relative mt-4 animate-fade-in">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="rounded-full bg-gradient-to-r from-black-in-deep to-black-in transition-[width] duration-700"
              style={{ width: `${Math.max(0, Math.min(100, margin ?? 0))}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-muted">
            You keep <span className="font-medium text-fg">{Math.max(0, margin ?? 0)}c</span> of every dollar that comes in.
          </p>
        </div>
      )}

      {/* This month */}
      <section className="relative mt-9 animate-rise [animation-delay:150ms]">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.16em] text-muted">This month</h2>
        {thisMonth.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/12 px-6 py-8 text-center">
            <p className="text-[16px] font-medium">Nothing here yet.</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
              Finished a job? Tap <span className="text-black-in">Job done</span> below. It takes about 10 seconds.
            </p>
          </div>
        ) : (
          <ul className="card divide-y divide-line overflow-hidden rounded-3xl">
            {thisMonth.slice(0, 50).map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setOpenRow((r) => (r === e.id ? null : e.id))}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-white/[0.03]"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold ${
                      e.kind === "in" ? "bg-black-in/12 text-black-in" : "bg-red-out/12 text-red-out"
                    }`}
                  >
                    {e.kind === "in" ? "+" : "−"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{e.customer ?? e.description}</span>
                    <span className="block truncate text-[13px] text-muted">
                      {e.customer ? `${e.description} · ` : ""}
                      {shortDay(e.created_at)}
                    </span>
                  </span>
                  <span className={`tabular shrink-0 text-[16px] font-semibold ${e.kind === "in" ? "text-black-in" : "text-fg/80"}`}>
                    {e.kind === "in" ? "+" : "−"}
                    {formatMoney(e.amount_cents)}
                  </span>
                </button>
                {openRow === e.id && !e.id.startsWith("temp-") && (
                  <div className="flex justify-end gap-2 px-4 pb-3 animate-fade-in">
                    <button onClick={() => setOpenRow(null)} className="rounded-full px-4 py-2 text-[14px] text-muted">
                      Keep
                    </button>
                    <button
                      onClick={() => remove(e.id)}
                      className="rounded-full bg-red-out/15 px-4 py-2 text-[14px] font-medium text-red-out active:bg-red-out/25"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* The one button */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-ink via-ink/95 to-transparent pt-10 pb-safe">
        <div className="mx-auto max-w-md px-5">
          <button
            onClick={() => setSheet("in")}
            className="group relative flex h-[68px] w-full items-center justify-center gap-3 overflow-hidden rounded-[24px] bg-gradient-to-b from-[#4ff3b4] to-black-in-deep text-[20px] font-semibold text-[#03140c] shadow-[0_18px_40px_-14px_rgb(46_230_160/0.8),inset_0_1px_0_rgb(255_255_255/0.45)] transition active:scale-[0.98]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Job done
          </button>
        </div>
      </div>

      {sheet && (
        <EntrySheet
          kind={sheet}
          suggestions={suggestions[sheet]}
          onClose={closeSheet}
          onSave={(fields) => add(sheet, fields)}
        />
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="fixed inset-x-5 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+84px)] z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-line bg-[#161b22]/95 py-2 pr-2 pl-4 shadow-2xl backdrop-blur-xl animate-toast"
        >
          <span
            className={`size-2 shrink-0 rounded-full ${
              toast.tone === "in" ? "bg-black-in" : toast.tone === "out" ? "bg-red-out" : "bg-amber-400"
            }`}
          />
          <span className="min-w-0 flex-1 truncate py-2 text-[15px]">{toast.text}</span>
          {toast.undoId && (
            <button
              onClick={() => {
                setToast(null);
                remove(toast.undoId!);
              }}
              className="shrink-0 rounded-xl px-3 py-2 text-[15px] font-semibold text-black-in active:bg-white/5"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </main>
  );
}

function Tile({
  label,
  cents,
  tone,
  hint,
  onClick,
}: {
  label: string;
  cents: number;
  tone: "in" | "out";
  hint: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="card rounded-3xl p-4 text-left transition active:scale-[0.98]">
      <span className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        <span
          className={`flex size-6 items-center justify-center rounded-full text-[13px] ${
            tone === "in" ? "bg-black-in/15 text-black-in" : "bg-red-out/15 text-red-out"
          }`}
        >
          {tone === "in" ? "↑" : "↓"}
        </span>
      </span>
      <AnimatedMoney cents={cents} className="mt-2 block text-[28px] leading-tight font-semibold tracking-tight" />
      <span className="mt-1 block text-[12px] text-muted">+ {hint}</span>
    </button>
  );
}

function buzz(pattern: number | number[]) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}
