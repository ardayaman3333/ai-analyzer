import Link from "next/link";
import { headers } from "next/headers";

async function fetchAnalyses() {
  const hdrs = await headers();
  const getHeader = (name: string) => {
    const lower = name.toLowerCase();
    // Some runtimes expose a Headers-like object, others a plain record
    if (typeof (hdrs as Headers).get === "function") {
      return (hdrs as Headers).get(name);
    }
    const record = hdrs as unknown as Record<string, string | string[] | undefined>;
    const value = record[lower] ?? record[name];
    return Array.isArray(value) ? value[0] : value;
  };

  const host = getHeader("x-forwarded-host") || getHeader("host") || "localhost:3000";
  const proto = getHeader("x-forwarded-proto") || (process.env.VERCEL ? "https" : "http");
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/analyses?limit=50`, { cache: "no-store" });
  if (!res.ok) return [] as any[];
  return res.json();
}

export default async function AnalysesPage() {
  const items = (await fetchAnalyses()) as Array<{
    id: string;
    query: string;
    status: string;
    classification?: string | null;
    reportReady?: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
  }>;

  const total = items.length;
  const completed = items.filter((it) => it.status === "completed").length;
  const running = items.filter((it) => it.status !== "completed" && it.status !== "failed").length;

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString() : "-";

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "failed") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  const reportColor = (ready?: boolean) =>
    ready
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : "bg-slate-500/10 text-slate-300 border-white/10";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Monitor</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-white">Analyses</h1>
              <p className="mt-2 text-slate-300">
                Track every exploration request, see their status in real time and jump into the reports.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-white hover:text-white"
            >
              + New analysis
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-slate-300">Total analyses</p>
            <p className="mt-2 text-3xl font-semibold text-white">{total}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-slate-300">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-300">{completed}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm text-slate-300">Running</p>
            <p className="mt-2 text-3xl font-semibold text-amber-300">{running}</p>
          </div>
        </section>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-slate-300">
            No analyses yet. Launch one from the home screen to see it listed here.
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-white/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                      {it.classification || "Unclassified"}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-xl font-semibold text-white">{it.query}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 font-semibold ${statusColor(
                        it.status
                      )}`}
                    >
                      {it.status}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 font-semibold ${reportColor(
                        it.reportReady
                      )}`}
                    >
                      {it.reportReady ? "Report ready" : "Report pending"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <div>
                    <p className="text-slate-400">Created</p>
                    <p>{formatDate(it.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Updated</p>
                    <p>{formatDate(it.updatedAt)}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <div className="text-slate-400">ID: {it.id}</div>
                  <Link
                    href={`/analysis/${it.id}`}
                    className="rounded-full border border-white/20 px-4 py-2 text-slate-100 transition hover:border-white hover:text-white"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
