"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check } from "lucide-react";

const DISMISS_KEY = "givezy_lead_dismissed_at";
const DISMISS_DAYS = 14;

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // storage blocked — the popup will simply show again next visit
  }
}

export default function LeadCapture({
  title,
  body,
  delaySeconds,
}: {
  title: string;
  body: string;
  delaySeconds: number;
}) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<"homepage_timed" | "homepage_exit">("homepage_timed");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Guards against the timer and exit-intent both firing
  const shownRef = useRef(false);

  const show = useCallback((from: "homepage_timed" | "homepage_exit") => {
    if (shownRef.current || recentlyDismissed()) return;
    shownRef.current = true;
    setSource(from);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (recentlyDismissed()) return;

    const timer = window.setTimeout(() => show("homepage_timed"), Math.max(0, delaySeconds) * 1000);

    function onMouseOut(e: MouseEvent) {
      // Pointer left through the top of the viewport — classic exit intent
      if (e.clientY <= 0 && !e.relatedTarget) show("homepage_exit");
    }

    document.addEventListener("mouseout", onMouseOut);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [delaySeconds, show]);

  const close = useCallback(() => {
    setOpen(false);
    rememberDismissal();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) {
      setError("Please leave an email or a phone number");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, source }),
      });
      if (!res.ok) throw new Error("Could not save your details");
      setDone(true);
      rememberDismissal();
      window.setTimeout(() => setOpen(false), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-capture-title"
        >
          <motion.div
            className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            {done ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <p className="font-semibold text-gray-900">Got it — thank you!</p>
                <p className="text-sm text-gray-500 mt-1">We&apos;ll be in touch soon.</p>
              </div>
            ) : (
              <>
                <h2 id="lead-capture-title" className="text-lg font-bold text-gray-900 pr-6">
                  {title}
                </h2>
                <p className="text-sm text-gray-500 mt-1.5 mb-5">{body}</p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />

                  {error && <p className="text-xs text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Keep me posted
                  </button>
                </form>

                <button onClick={close} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3">
                  No thanks
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
