import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { gte } from "drizzle-orm";
import { AdminShell } from "../layout";
import { getAnalytics, viewsOf, istDay } from "@/lib/analytics";
import { isLegacyStatus, NON_CONSUMING_STATUSES } from "@/lib/donation-status";

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const since = new Date();
  since.setDate(since.getDate() - (WINDOW_DAYS - 1));

  const [summary, homeVisitors, formVisitors, recent] = await Promise.all([
    getAnalytics(WINDOW_DAYS),
    viewsOf("/", WINDOW_DAYS),
    viewsOf("/donate", WINDOW_DAYS),
    db.select().from(donations).where(gte(donations.createdAt, since.toISOString())),
  ]);

  const current = recent.filter((d) => !isLegacyStatus(d.status));
  const started = current.length;
  const paid = current.filter(
    (d) => !(NON_CONSUMING_STATUSES as readonly string[]).includes(d.status),
  ).length;

  return <AnalyticsView summary={summary} homeVisitors={homeVisitors} formVisitors={formVisitors} started={started} paid={paid} />;
}

export function AnalyticsView({
  summary,
  homeVisitors,
  formVisitors,
  started,
  paid,
}: {
  summary: Awaited<ReturnType<typeof getAnalytics>>;
  homeVisitors: number;
  formVisitors: number;
  started: number;
  paid: number;
}) {
  const peak = Math.max(1, ...summary.daily.map((d) => d.views));

  const funnel = [
    { label: "Visited the site", value: homeVisitors, note: "people, not page refreshes" },
    { label: "Opened the form", value: formVisitors, note: "reached /donate" },
    { label: "Filled it in", value: started, note: "got as far as a booking record" },
    { label: "Paid", value: paid, note: "completed checkout" },
  ];
  const funnelTop = Math.max(1, ...funnel.map((f) => f.value));

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Visitors</h1>
      <p className="text-sm text-gray-500 mb-6">
        Last {WINDOW_DAYS} days. No cookies and no third party — counts are worked out on our own
        server and nothing identifying is stored.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Page views" value={summary.totals.views} tone="bg-gray-100 text-gray-900" />
        <Stat label="Visitors" value={summary.totals.visitors} tone="bg-brand/8 text-brand" />
        <Stat label="Bookings started" value={started} tone="bg-blue-50 text-blue-700" />
        <Stat label="Paid" value={paid} tone="bg-brand/8 text-brand" />
      </div>

      {summary.totals.views === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">Nothing recorded yet.</p>
          <p className="mt-1">
            Counting starts from the moment this went live, so there is no history before today.
            Give it a day — and if it is still empty after real visits, say so, because that means
            something is wrong rather than quiet.
          </p>
        </div>
      ) : (
        <>
          {/* ── Funnel ── */}
          <section className="mb-10">
            <h2 className="font-semibold text-gray-900 mb-1">Where people drop off</h2>
            <p className="text-sm text-gray-500 mb-4">
              The gap between two bars is the question worth asking. A big fall from
              &ldquo;visited&rdquo; to &ldquo;opened the form&rdquo; is a homepage problem; a fall
              from &ldquo;filled it in&rdquo; to &ldquo;paid&rdquo; is usually the price.
            </p>
            <div className="space-y-3">
              {funnel.map((step, i) => {
                const prev = i > 0 ? funnel[i - 1].value : null;
                const pct = prev && prev > 0 ? Math.round((step.value / prev) * 100) : null;
                return (
                  <div key={step.label}>
                    <div className="flex justify-between items-baseline text-sm mb-1">
                      <span className="text-gray-700 font-medium">{step.label}</span>
                      <span className="text-gray-900 font-semibold">
                        {step.value}
                        {pct !== null && (
                          <span className="text-gray-400 font-normal ml-2">{pct}% of previous</span>
                        )}
                      </span>
                    </div>
                    <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-lg transition-all"
                        style={{ width: `${Math.max(2, (step.value / funnelTop) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{step.note}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Daily chart ── */}
          <section className="mb-10">
            <h2 className="font-semibold text-gray-900 mb-4">Views a day</h2>
            <div className="flex items-end gap-1 h-36 border-b border-gray-200 pb-px">
              {summary.daily.map((d) => (
                <div key={d.day} className="flex-1 group relative flex items-end h-full">
                  <div
                    className="w-full bg-brand/70 hover:bg-brand rounded-t transition-colors"
                    style={{ height: `${Math.max(1, (d.views / peak) * 100)}%` }}
                  />
                  <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white">
                    {d.day}: {d.views} views, {d.visitors} visitors
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{summary.daily[0]?.day}</span>
              <span>{istDay()}</span>
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            {/* ── Pages ── */}
            <section>
              <h2 className="font-semibold text-gray-900 mb-3">Most-read pages</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">Page</th>
                    <th className="pb-2 font-medium text-right">Views</th>
                    <th className="pb-2 font-medium text-right">Visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topPages.map((p) => (
                    <tr key={p.path} className="border-b border-gray-100">
                      <td className="py-2 font-mono text-xs text-gray-700">{p.path}</td>
                      <td className="py-2 text-right">{p.views}</td>
                      <td className="py-2 text-right text-gray-500">{p.visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* ── Referrers ── */}
            <section>
              <h2 className="font-semibold text-gray-900 mb-1">Where they came from</h2>
              <p className="text-xs text-gray-400 mb-3">
                &ldquo;Direct&rdquo; means typed in, bookmarked, or opened from an app that strips
                the referrer — which includes most of WhatsApp and Instagram.
              </p>
              {summary.referrers.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {summary.referrers.map((r) => {
                    const pct = Math.round((r.views / summary.totals.visitors || 0) * 100);
                    return (
                      <div key={r.source}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 capitalize">{r.source}</span>
                          <span className="text-gray-900 font-medium">{r.views}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-lg p-4 ${tone}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium opacity-70">{label}</p>
    </div>
  );
}
