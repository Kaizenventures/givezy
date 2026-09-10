"use client";

import { useState } from "react";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import type { WeightBucket, Caps, SiteContent } from "@/lib/settings";

type Tab = "pricing" | "caps" | "content";

export default function AdminSettingsForm({
  initialBuckets,
  initialCaps,
  initialContent,
}: {
  initialBuckets: WeightBucket[];
  initialCaps: Caps;
  initialContent: SiteContent;
}) {
  const [tab, setTab] = useState<Tab>("pricing");
  const [buckets, setBuckets] = useState<WeightBucket[]>(initialBuckets);
  const [caps, setCaps] = useState<Caps>(initialCaps);
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buckets, caps, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setMessage({ kind: "ok", text: "Saved. Changes are live on the site." });
    } catch (err) {
      setMessage({ kind: "err", text: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  }

  function updateBucket(i: number, patch: Partial<WeightBucket>) {
    setBuckets((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["pricing", "caps", "content"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t === "caps" ? "Caps" : t}
            </button>
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>

      {message && (
        <div
          className={`mb-5 p-3 rounded-lg text-sm ${
            message.kind === "ok"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ─── Pricing ─── */}
      {tab === "pricing" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Donors see these options and pay the price shown. Prices are in rupees.{" "}
            <strong>Grams</strong> is the weight we send to Shiprocket when booking the pickup.
          </p>

          {buckets.map((b, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Labeled label="Option ID">
                  <input value={b.id} onChange={(e) => updateBucket(i, { id: e.target.value })} className={inp} />
                </Labeled>
                <Labeled label="Label">
                  <input value={b.label} onChange={(e) => updateBucket(i, { label: e.target.value })} className={inp} />
                </Labeled>
                <Labeled label="Max kg">
                  <input
                    type="number"
                    min={1}
                    value={b.maxKg}
                    onChange={(e) => updateBucket(i, { maxKg: Number(e.target.value) })}
                    className={inp}
                  />
                </Labeled>
                <Labeled label="Price (₹)">
                  <input
                    type="number"
                    min={0}
                    value={Math.round(b.pricePaise / 100)}
                    onChange={(e) => updateBucket(i, { pricePaise: Math.round(Number(e.target.value) * 100) })}
                    className={inp}
                  />
                </Labeled>
                <Labeled label="Ship weight (g)">
                  <input
                    type="number"
                    min={1}
                    value={b.grams}
                    onChange={(e) => updateBucket(i, { grams: Number(e.target.value) })}
                    className={inp}
                  />
                </Labeled>
              </div>
              <div className="flex items-end gap-3 mt-3">
                <Labeled label="Hint shown to donor" className="flex-1">
                  <input value={b.hint} onChange={(e) => updateBucket(i, { hint: e.target.value })} className={inp} />
                </Labeled>
                <button
                  onClick={() => setBuckets((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={buckets.length <= 1}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Remove option"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() =>
              setBuckets((prev) => [
                ...prev,
                { id: `option-${prev.length + 1}`, label: "New option", hint: "", maxKg: 5, pricePaise: 19900, grams: 4000 },
              ])
            }
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:underline"
          >
            <Plus className="w-4 h-4" />
            Add weight option
          </button>
        </div>
      )}

      {/* ─── Caps ─── */}
      {tab === "caps" && (
        <div className="space-y-5 max-w-md">
          <p className="text-sm text-gray-500">
            Maximum paid pickups accepted per period. Set a value to <strong>0</strong> for no limit. When any
            limit is reached, the donate page switches to a waiting-list form instead of payment.
          </p>
          {(["daily", "weekly", "monthly"] as (keyof Caps)[]).map((k) => (
            <Labeled key={k} label={`Per ${k.replace("ly", "")}${k === "daily" ? "" : ""} (${k})`}>
              <input
                type="number"
                min={0}
                value={caps[k]}
                onChange={(e) => setCaps({ ...caps, [k]: Math.max(0, Number(e.target.value)) })}
                className={inp}
              />
            </Labeled>
          ))}
          <p className="text-xs text-gray-400">
            Weeks start on Monday. Only paid donations count — abandoned checkouts and cancellations don&apos;t
            use up a slot.
          </p>
        </div>
      )}

      {/* ─── Content ─── */}
      {tab === "content" && (
        <div className="space-y-5 max-w-2xl">
          <Labeled label="Hero headline">
            <input value={content.heroTitle} onChange={(e) => setContent({ ...content, heroTitle: e.target.value })} className={inp} />
          </Labeled>
          <Labeled label="Hero subtitle">
            <textarea rows={3} value={content.heroSubtitle} onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })} className={`${inp} resize-y`} />
          </Labeled>
          <Labeled label="Pickup line (appended to the subtitle)">
            <input value={content.pickupLine} onChange={(e) => setContent({ ...content, pickupLine: e.target.value })} className={inp} />
          </Labeled>

          <Labeled label="Impact heading">
            <input value={content.impactTitle} onChange={(e) => setContent({ ...content, impactTitle: e.target.value })} className={inp} />
          </Labeled>
          <Labeled label="Impact body — blank line between paragraphs">
            <textarea rows={7} value={content.impactBody} onChange={(e) => setContent({ ...content, impactBody: e.target.value })} className={`${inp} resize-y`} />
          </Labeled>

          <Labeled label="How it works — one step per line">
            <textarea
              rows={6}
              value={content.howItWorks.join("\n")}
              onChange={(e) => setContent({ ...content, howItWorks: e.target.value.split("\n") })}
              className={`${inp} resize-y`}
            />
          </Labeled>

          <Labeled label='"Get started" eyebrow'>
            <input value={content.getStartedTitle} onChange={(e) => setContent({ ...content, getStartedTitle: e.target.value })} className={inp} />
          </Labeled>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={content.clothesComingSoon}
              onChange={(e) => setContent({ ...content, clothesComingSoon: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">
              Clothes are &ldquo;launching soon&rdquo; (uncheck to start accepting clothes)
            </span>
          </label>

          <hr className="border-gray-200" />

          <Labeled label="Thank-you page heading">
            <input value={content.nextStepTitle} onChange={(e) => setContent({ ...content, nextStepTitle: e.target.value })} className={inp} />
          </Labeled>
          <Labeled label="Thank-you page body">
            <textarea rows={4} value={content.nextStepBody} onChange={(e) => setContent({ ...content, nextStepBody: e.target.value })} className={`${inp} resize-y`} />
          </Labeled>
          <Labeled label="WhatsApp number (with country code, e.g. 919876543210)">
            <input value={content.whatsappNumber} onChange={(e) => setContent({ ...content, whatsappNumber: e.target.value })} className={inp} placeholder="919876543210" />
          </Labeled>

          <hr className="border-gray-200" />

          <Labeled label="Lead popup heading">
            <input value={content.leadPopupTitle} onChange={(e) => setContent({ ...content, leadPopupTitle: e.target.value })} className={inp} />
          </Labeled>
          <Labeled label="Lead popup body">
            <textarea rows={3} value={content.leadPopupBody} onChange={(e) => setContent({ ...content, leadPopupBody: e.target.value })} className={`${inp} resize-y`} />
          </Labeled>
          <Labeled label="Popup delay (seconds) — it also fires on exit intent">
            <input
              type="number"
              min={0}
              max={120}
              value={content.leadPopupDelaySeconds}
              onChange={(e) => setContent({ ...content, leadPopupDelaySeconds: Number(e.target.value) })}
              className={inp}
            />
          </Labeled>
        </div>
      )}
    </div>
  );
}

const inp =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none";

function Labeled({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
