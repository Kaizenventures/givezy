/**
 * Which environment this instance is. Staging runs the same image as
 * production, so nothing about the build distinguishes them — only APP_ENV,
 * set per service in docker-compose.yml.
 */

export type AppEnv = "production" | "staging" | "development";

export function appEnv(): AppEnv {
  const value = process.env.APP_ENV;
  if (value === "staging") return "staging";
  if (value === "production") return "production";
  // Unset locally: fall back to how Next was started
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function isProduction(): boolean {
  return appEnv() === "production";
}

/** Canonical URL of this instance, used for metadata, sitemaps and email links. */
export function siteUrl(): string {
  return process.env.NEXTAUTH_URL || "https://givezy.in";
}
