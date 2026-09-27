import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import type { Entry } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

const DAY_MS = 86_400_000;

export default async function Home() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  // A month is never longer than 31 days, so 32 always covers "this month";
  // the client trims to the exact month (plus recent names for quick-pick chips).
  const now = new Date();
  const { data } = await supabase
    .from("entries")
    .select("id, kind, customer, description, amount_cents, created_at")
    .gte("created_at", new Date(now.getTime() - 32 * DAY_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <Dashboard
      initialEntries={(data ?? []) as Entry[]}
      nowIso={now.toISOString()}
      email={(auth.claims.email as string | undefined) ?? ""}
    />
  );
}
