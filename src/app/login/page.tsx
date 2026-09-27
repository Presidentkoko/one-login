import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · One Login" };

export default function LoginPage() {
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-safe">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[60vh] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(46_230_160/0.22),transparent_70%)]"
      />

      <header className="relative flex items-center gap-2.5 animate-rise">
        <Logo className="size-8" />
        <span className="text-[17px] font-semibold tracking-tight">One Login</span>
      </header>

      <section className="relative mt-12 animate-rise [animation-delay:60ms]">
        <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em]">
          Your whole month.
          <br />
          <span className="bg-gradient-to-r from-[#7af7c6] to-black-in-deep bg-clip-text text-transparent">
            One screen.
          </span>
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">
          Money in. Money out. Profit. Tap <span className="text-fg">Job done</span> when you
          finish a job, and it adds up for you.
        </p>
      </section>

      <div className="relative mt-10 animate-rise [animation-delay:120ms]">
        <LoginForm />
      </div>

      <p className="relative mt-auto pt-10 text-center text-[13px] text-muted/70 animate-rise [animation-delay:180ms]">
        Site VIP · Angus Shield
      </p>
    </main>
  );
}
