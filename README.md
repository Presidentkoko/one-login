# One Login

**One login. One screen. One button.**
This month's money in, money out and profit, big and green when you're in the black, red when you're not. Finish a job, tap **Job done**, and the numbers move straight away.

Built with Next.js 16 (App Router), Supabase (Auth + Postgres with row-level security) and Tailwind CSS 4. Deployed on Vercel.

## The 30-second test

1. Type an email and a password, then tap **Let's go**. New users get an account on the spot, from the same button.
2. Tap **Job done**. Enter the customer, the job and the price, then tap **Add**.
3. The profit number counts up and pulses. Made a mistake? Tap **Undo**.

## What's in it

- **One button to sign in.** It signs you in, or creates the account if the email is new.
- **One screen.** It shows profit for the month (green or red), money in, money out, the days left in the month, and how many cents of every dollar you keep.
- **Instant updates.** Changes show immediately and sync in the background, with rollback if the network drops.
- **Speed.** Recent customers and jobs appear as one-tap chips, and costs have presets (Materials, Fuel, Tools, Subbie, Wages).
- **Phone-first.** It handles safe areas, lifts the sheet above the keyboard, uses haptics, can be installed as a PWA, and respects reduced motion.
- **Secure by default.** Every row is locked to its owner by Postgres RLS, so the browser never sees anyone else's data.

## What I left out, on purpose

GST splits, invoices, charts, month pickers, categories, settings, onboarding tours, password reset emails and multi-user teams. Each one is a good feature, and each one makes the 30-second test slower. The screen answers one question: *am I in the black this month?*

## Run it locally

```bash
npm install
cp .env.example .env.local   # add your Supabase URL + publishable key
npm run dev
```

In Supabase:

1. SQL Editor: run [`supabase/schema.sql`](supabase/schema.sql).
2. Authentication → Sign In / Providers → Email: turn **off** "Confirm email", so sign-up is instant.
