"use client";

import { useState } from "react";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import type { WeightBucket, Caps, SiteContent, Genre } from "@/lib/settings";

type Tab = "pricing" | "caps" | "content";

export default function AdminSettingsForm({
  initialBuckets,
  initialCountBuckets,
  initialGenres,
  initialCaps,
  initialContent,
}: {
  initialBuckets: WeightBucket[];
  initialCountBuckets: WeightBucket[];
  initialGenres: Genre[];
  initialCaps: Caps;
  initialContent: SiteContent;
}) {
  const [tab, setTab] = useState<Tab>("pricing");
  const [buckets, setBuckets] = useState<WeightBucket[]>(initialBuckets);
  const [countBuckets, setCountBuckets] = useState<WeightBucket[]>(initialCountBuckets);
  const [genres, setGenres] = useState<Genre[]>(initialGenres);
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
        body: JSON.stringify({ buckets, countBuckets, genres, caps, content }),
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

  // Book-count options mirror the weight options and must share their ids, so
  // only the wording differs between the two scales.
  function updateCountBucket(i: number, patch: Partial<WeightBucket>) {
    setCountBuckets((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
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

          <hr className="border-gray-200 !mt-8" />

          <div>
            <h3 className="font-semibold text-gray-900">Book-count wording</h3>
            <p className="text-sm text-gray-500 mt-1 mb-3">
              The same options described in books rather than kilos, for donors who pick &ldquo;By
              books&rdquo;. Prices come from the weight options above — only the wording changes here.
            </p>
            <div className="space-y-3">
              {countBuckets.map((b, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <Labeled label="Matches option ID">
                    <select
                      value={b.id}
                      onChange={(e) => {
                        const src = buckets.find((x) => x.id === e.target.value);
                        updateCountBucket(i, {
                          id: e.target.value,
                          pricePaise: src?.pricePaise ?? b.pricePaise,
                          maxKg: src?.maxKg ?? b.maxKg,
                          grams: src?.grams ?? b.grams,
                        });
                      }}
                      className={inp}
                    >
                      {buckets.map((x) => (
                        <option key={x.id} value={x.id}>{x.id}</option>
                      ))}
                    </select>
                  </Labeled>
                  <Labeled label="Label">
                    <input value={b.label} onChange={(e) => updateCountBucket(i, { label: e.target.value })} className={inp} />
                  </Labeled>
                  <div className="flex items-end gap-2">
                    <Labeled label="Hint" className="flex-1">
                      <input value={b.hint} onChange={(e) => updateCountBucket(i, { hint: e.target.value })} className={inp} />
                    </Labeled>
                    <button
                      onClick={() => setCountBuckets((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={countBuckets.length <= 1}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setCountBuckets((prev) => {
                  const src = buckets[0];
                  return [...prev, { id: src?.id ?? "upto-5kg", label: "New wording", hint: "", maxKg: src?.maxKg ?? 5, pricePaise: src?.pricePaise ?? 19900, grams: src?.grams ?? 4000 }];
                })
              }
              className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:underline mt-3"
            >
              <Plus className="w-4 h-4" />
              Add wording
            </button>
          </div>

          <hr className="border-gray-200 !mt-8" />

          <div>
            <h3 className="font-semibold text-gray-900">Book categories</h3>
            <p className="text-sm text-gray-500 mt-1 mb-3">
              Optional tags donors can pick, so you know what&apos;s coming before it arrives.
            </p>
            <div className="space-y-2">
              {genres.map((g, i) => (
                <div key={i} className="flex items-end gap-2">
                  <Labeled label="ID" className="w-40">
                    <input
                      value={g.id}
                      onChange={(e) => setGenres((prev) => prev.map((x, idx) => (idx === i ? { ...x, id: e.target.value } : x)))}
                      className={inp}
                    />
                  </Labeled>
                  <Labeled label="Label shown to donors" className="flex-1">
                    <input
                      value={g.label}
                      onChange={(e) => setGenres((prev) => prev.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                      className={inp}
                    />
                  </Labeled>
                  <button
                    onClick={() => setGenres((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    aria-label="Remove category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setGenres((prev) => [...prev, { id: `genre-${prev.length + 1}`, label: "New category" }])}
              className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:underline mt-3"
            >
              <Plus className="w-4 h-4" />
              Add category
            </button>
          </div>
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
            Weeks start on Monday (IST). Only paid donations count — abandoned checkouts and
            cancellations don&apos;t use up a slot.
          </p>

          <hr className="border-gray-200" />

          <h3 className="font-semibold text-gray-900">What donors see when you&apos;re full</h3>
          <Labeled label="Heading">
            <input value={content.capMessageTitle} onChange={(e) => setContent({ ...content, capMessageTitle: e.target.value })} className={inp} />
          </Labeled>
          <Labeled label="Message">
            <textarea rows={3} value={content.capMessageBody} onChange={(e) => setContent({ ...content, capMessageBody: e.target.value })} className={`${inp} resize-y`} />
          </Labeled>
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
