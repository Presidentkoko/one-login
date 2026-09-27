"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { toAuthEmail } from "@/lib/username";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // One button for everyone: sign in, or — if there's no account yet — make one.
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const email = toAuthEmail(identifier);
    if (!email) {
      return stop({ error: "Usernames can use letters, numbers, dots, dashes and underscores." });
    }

    const supabase = createClient();
    const signIn = await supabase.auth.signInWithPassword({ email, password });

    if (!signIn.error) return enter();
    if (signIn.error.code === "email_not_confirmed") {
      return stop({ notice: "Check your inbox to confirm your email, then tap Let's go again." });
    }
    if (signIn.error.code !== "invalid_credentials") return stop({ error: signIn.error.message });

    const signUp = await supabase.auth.signUp({ email, password });
    if (signUp.error) {
      const code = signUp.error.code;
      return stop({
        error:
          code === "user_already_exists" || code === "email_exists"
            ? "That password doesn't match."
            : code === "weak_password"
              ? "Pick a password with at least 6 characters."
              : signUp.error.message,
      });
    }
    if (signUp.data.session) return enter();
    // Supabase hides whether an email exists; an empty identity list means it does.
    if (signUp.data.user?.identities?.length === 0) {
      return stop({ error: "That password doesn't match." });
    }
    stop({ notice: "Nearly there. Confirm your email, then tap Let's go again." });
  }

  function enter() {
    if ("vibrate" in navigator) navigator.vibrate(12);
    router.replace("/");
    router.refresh();
  }

  function stop(message: { error?: string; notice?: string }) {
    setError(message.error ?? null);
    setNotice(message.notice ?? null);
    setBusy(false);
  }

  const ready = identifier.trim().length > 0 && password.length > 0;

  return (
    <form onSubmit={submit} className="card rounded-[28px] p-2">
      <label className="block rounded-[22px] px-4 pt-3 pb-2 transition focus-within:bg-white/[0.04]">
        <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
          Username or email
        </span>
        <input
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="e.g. dave"
          className="mt-0.5 block w-full bg-transparent text-[18px] outline-none placeholder:text-white/25"
        />
      </label>

      <div className="mx-4 h-px bg-line" />

      <label className="block rounded-[22px] px-4 pt-3 pb-2 transition focus-within:bg-white/[0.04]">
        <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Password</span>
        <span className="flex items-center gap-2">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            enterKeyHint="go"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-0.5 block w-full bg-transparent text-[18px] outline-none placeholder:text-white/25"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="shrink-0 rounded-full px-2 py-1 text-[13px] font-medium text-muted active:text-fg"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
      </label>

      {(error || notice) && (
        <p
          role="status"
          className={`mx-4 mt-1 mb-1 text-[14px] animate-fade-in ${error ? "text-red-out" : "text-black-in"}`}
        >
          {error ?? notice}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !ready}
        className="mt-2 flex h-[60px] w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-b from-[#4ff3b4] to-black-in-deep text-[18px] font-semibold text-[#03140c] shadow-[0_10px_30px_-10px_rgb(46_230_160/0.7),inset_0_1px_0_rgb(255_255_255/0.4)] transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
      >
        {busy ? <Spinner /> : <>Let&apos;s go <Arrow /></>}
      </button>

      <p className="px-4 pt-3 pb-2 text-center text-[13px] text-muted">
        New here? Same button. Your account is set up on the spot.
      </p>
    </form>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <path d="M4 10h11m-4.5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-label="Signing in"
      className="size-5 animate-spin rounded-full border-2 border-[#03140c]/30 border-t-[#03140c]"
    />
  );
}
