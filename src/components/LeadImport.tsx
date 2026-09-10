"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ChevronDown } from "lucide-react";

export default function LeadImport() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult({
        kind: "ok",
        text: `Found ${data.found} address(es) — imported ${data.imported}, skipped ${data.skipped} already on file.`,
      });
      setText("");
      router.refresh();
    } catch (err) {
      setResult({ kind: "err", text: err instanceof Error ? err.message : "Import failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-xl"
      >
        <span className="inline-flex items-center gap-2">
          <Upload className="w-4 h-4 text-gray-400" />
          Import people who emailed you
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500 mb-3">
            Paste anything containing email addresses — a list, a forwarded thread, or{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">Name &lt;email@example.com&gt;</code> pairs.
            Every address found becomes a lead; ones already on file are skipped.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={"Asha Rao <asha@example.com>\nrahul@example.com\n..."}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y"
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={run}
              disabled={busy || !text.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import
            </button>
            {result && (
              <p className={`text-sm ${result.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
                {result.text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
