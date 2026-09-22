"use client";

import { useState } from "react";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import type { Bag, Caps, SiteContent, Genre, ServiceArea } from "@/lib/settings";
import ServiceAreaMap from "@/components/ServiceAreaMap";
import ServiceAreaTester from "@/components/ServiceAreaTester";

type Tab = "pricing" | "area" | "caps" | "content";

export default function AdminSettingsForm({
  initialBags,
  initialServiceArea,
  initialGenres,
  initialCaps,
  initialContent,
}: {
  initialBags: Bag[];
  initialServiceArea: ServiceArea;
  initialGenres: Genre[];
  initialCaps: Caps;
  initialContent: SiteContent;
}) {
  const [tab, setTab] = useState<Tab>("pricing");
  const [bags, setBags] = useState<Bag[]>(initialBags);
  const [serviceArea, setServiceArea] = useState<ServiceArea>(initialServiceArea);
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
        body: JSON.stringify({ bags, genres, caps, content, serviceArea }),
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

  function updateBag(i: number, patch: Partial<Bag>) {
    setBags((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  function updatePacked(i: number, axis: 0 | 1 | 2, value: number) {
    setBags((prev) =>
      prev.map((b, idx) => {
        if (idx !== i) return b;
        const packedCm = [...b.packedCm] as [number, number, number];
        packedCm[axis] = value;
        return { ...b, packedCm };
      }),
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(["pricing", "area", "caps", "content"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t === "pricing" ? "Bags & prices" : t === "area" ? "Service area" : t === "caps" ? "Daily limits" : "Website text"}
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

      {/* ─── Bags & prices ─── */}
      {tab === "pricing" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            The sacks donors choose from. Each is posted empty, filled with books, and collected by
            courier. Prices are in rupees and go live as soon as you save.
          </p>

          {bags.map((b, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Labeled label="Name">
                  <input value={b.label} onChange={(e) => updateBag(i, { label: e.target.value })} className={inp} />
                </Labeled>
                <Labeled label="Price (₹)">
                  <input
                    type="number"
                    min={0}
                    value={Math.round(b.pricePaise / 100)}
                    onChange={(e) => updateBag(i, { pricePaise: Math.round(Number(e.target.value) * 100) })}
                    className={inp}
                  />
                </Labeled>
                <Labeled label="Width (cm)">
                  <input type="number" min={1} value={b.widthCm} onChange={(e) => updateBag(i, { widthCm: Number(e.target.value) })} className={inp} />
                </Labeled>
                <Labeled label="Length (cm)">
                  <input type="number" min={1} value={b.lengthCm} onChange={(e) => updateBag(i, { lengthCm: Number(e.target.value) })} className={inp} />
                </Labeled>
                <Labeled label="Fits about (books)">
                  <input type="number" min={1} value={b.approxBooks} onChange={(e) => updateBag(i, { approxBooks: Number(e.target.value) })} className={inp} />
                </Labeled>
                <Labeled label="Packing limit (kg)">
                  <input type="number" min={1} step="0.5" value={b.maxKg} onChange={(e) => updateBag(i, { maxKg: Number(e.target.value) })} className={inp} />
                </Labeled>
                <Labeled label="Hint shown to donors" className="col-span-2">
                  <input value={b.hint} onChange={(e) => updateBag(i, { hint: e.target.value })} className={inp} />
                </Labeled>
              </div>

              <details className="mt-3">
                <summary className="text-xs text-gray-500 cursor-pointer select-none">Courier details</summary>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {(["Packed length (cm)", "Packed width (cm)", "Packed height (cm)"] as const).map((label, axis) => (
                    <Labeled key={label} label={label}>
                      <input
                        type="number"
                        min={1}
                        value={b.packedCm[axis]}
                        onChange={(e) => updatePacked(i, axis as 0 | 1 | 2, Number(e.target.value))}
                        className={inp}
                      />
                    </Labeled>
                  ))}
                  <Labeled label="Empty bag (g)">
                    <input type="number" min={1} value={b.tareGrams} onChange={(e) => updateBag(i, { tareGrams: Number(e.target.value) })} className={inp} />
                  </Labeled>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  The courier is told this bag weighs {((b.maxKg * 1000 + b.tareGrams) / 1000).toFixed(2)} kg —
                  the packing limit plus the empty sack.
                </p>
                <Labeled label="Option ID — changing this unlinks past bookings" className="mt-3 max-w-xs">
                  <input value={b.id} onChange={(e) => updateBag(i, { id: e.target.value })} className={inp} />
                </Labeled>
              </details>

              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setBags((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={bags.length <= 1}
                  className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove bag
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() =>
              setBags((prev) => [
                ...prev,
                {
                  id: `bag-${Date.now().toString(36)}`,
                  label: "New bag",
                  hint: "",
                  widthCm: 40,
                  lengthCm: 60,
                  approxBooks: 15,
                  maxKg: 8,
                  pricePaise: 24900,
                  packedCm: [50, 35, 20],
                  tareGrams: 220,
                },
              ])
            }
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:underline"
          >
            <Plus className="w-4 h-4" />
            Add a bag size
          </button>

          <hr className="border-gray-200 !mt-8" />

          <PriceCheck />

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

      {/* ─── Service area ─── */}
      {tab === "area" && (
        <div className="space-y-6 max-w-2xl">
          <p className="text-sm text-gray-500">
            Where you collect from, and how far you&apos;ll travel. A giver whose pincode falls
            outside gets the waiting list instead of a payment screen, so you never take money for a
            pickup you can&apos;t reach.
          </p>

          <ServiceAreaMap value={serviceArea} onChange={setServiceArea} />

          <hr className="border-gray-200" />

          <ServiceAreaTester />

          <p className="text-xs text-gray-400">
            Distance is measured straight line from the pin to the centre of the giver&apos;s
            pincode, so treat it as approximate near the edge. If the lookup service is ever
            unreachable, bookings are let through rather than blocked.
          </p>
        </div>
      )}

      {/* ─── Caps ─── */}
      {tab === "caps" && (
        <div className="space-y-5 max-w-md">
          <p className="text-sm text-gray-500">
            Maximum paid pickups accepted per period. Set a value to <strong>0</strong> for no limit. When any
            limit is reached, the public form switches to a waiting list instead of taking payment.
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
            Weeks start on Monday (IST). Only paid pickups count — abandoned checkouts and
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

interface Quote {
  id: string;
  label: string;
  pricePaise: number;
  shippingKg: number;
  courierPaise: number | null;
  courierName: string | null;
  error: string | null;
}

/** Compares saved prices with what Shiprocket would charge from a given pincode. */
function PriceCheck() {
  const [pincode, setPincode] = useState("500032");
  const [busy, setBusy] = useState(false);
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/price-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't get quotes");
      setQuotes(data.quotes);
    } catch (err) {
      setQuotes(null);
      setError(err instanceof Error ? err.message : "Couldn't get quotes");
    } finally {
      setBusy(false);
    }
  }

  const rupees = (paise: number) => `₹${Math.round(paise / 100)}`;

  return (
    <div>
      <h3 className="font-semibold text-gray-900">Check prices against the courier</h3>
      <p className="text-sm text-gray-500 mt-1 mb-3">
        Asks Shiprocket what each <em>saved</em> bag would cost to collect from a pincode. If the
        courier costs more than you charge, you lose money on every pickup of that size.
      </p>
      <div className="flex items-end gap-2">
        <Labeled label="Donor pincode" className="w-36">
          <input
            value={pincode}
            inputMode="numeric"
            maxLength={6}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={inp}
          />
        </Labeled>
        <button
          onClick={run}
          disabled={busy || pincode.length !== 6}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Get courier quotes
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      {quotes && (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 font-medium">Bag</th>
                <th className="pb-2 font-medium">Declared weight</th>
                <th className="pb-2 font-medium">You charge</th>
                <th className="pb-2 font-medium">Courier</th>
                <th className="pb-2 font-medium">Left over</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const diff = q.courierPaise === null ? null : q.pricePaise - q.courierPaise;
                return (
                  <tr key={q.id} className="border-b border-gray-100">
                    <td className="py-2.5 font-medium text-gray-900">{q.label}</td>
                    <td className="py-2.5 text-gray-500 tabular-nums">{q.shippingKg.toFixed(2)} kg</td>
                    <td className="py-2.5 tabular-nums">{rupees(q.pricePaise)}</td>
                    <td className="py-2.5 tabular-nums">
                      {q.courierPaise === null ? (
                        <span className="text-gray-400">{q.error || "No quote"}</span>
                      ) : (
                        <>
                          {rupees(q.courierPaise)}
                          {q.courierName && <span className="text-xs text-gray-400"> · {q.courierName}</span>}
                        </>
                      )}
                    </td>
                    <td className={`py-2.5 font-medium tabular-nums ${diff === null ? "text-gray-400" : diff < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {diff === null ? "—" : diff < 0 ? `−${rupees(-diff)} loss` : rupees(diff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2">
            &ldquo;Left over&rdquo; must also cover the bag itself and posting it out.
          </p>
        </div>
      )}
    </div>
  );
}
