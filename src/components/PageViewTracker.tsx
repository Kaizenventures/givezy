"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Reports one pageview per navigation.
 *
 * Deliberately tiny and silent: no cookies, no third-party script, no state,
 * and every failure is swallowed — a visitor should never see a broken page
 * because a counter could not be incremented.
 *
 * React runs effects twice in development, and the App Router keeps this
 * mounted across client-side navigations, so the last reported path is held in
 * a ref to avoid counting the same view twice.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const reported = useRef<string | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    if (reported.current === pathname) return;
    reported.current = pathname;

    // Respect an explicit Do Not Track signal rather than counting anyway.
    const dnt =
      typeof navigator !== "undefined" &&
      (navigator.doNotTrack === "1" ||
        (window as { doNotTrack?: string }).doNotTrack === "1");
    if (dnt) return;

    // document.referrer describes the document load and does not change as the
    // App Router navigates, so it is only meaningful on the first report.
    // Sending it on every one would attribute every later page to the same
    // source all over again.
    const referrer = isFirstLoad.current ? document.referrer || null : null;
    isFirstLoad.current = false;

    const body = JSON.stringify({ path: pathname, referrer });

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
