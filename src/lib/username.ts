// Supabase Auth signs people in by email. A plain username (e.g. "admin1")
// quietly becomes <username>@one-login.vercel.app, so both work in one box.
const USERNAME_DOMAIN = "one-login.vercel.app";

/** "admin1" -> "admin1@one-login.vercel.app"; emails pass through; null if unusable. */
export function toAuthEmail(identifier: string): string | null {
  const value = identifier.trim().toLowerCase();
  if (value.includes("@")) return value;
  return /^[a-z0-9._-]{2,32}$/.test(value) ? `${value}@${USERNAME_DOMAIN}` : null;
}

/** Show "admin1", not the email Supabase stores behind it. */
export function displayName(email: string) {
  const suffix = `@${USERNAME_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}
