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

  return (
    <main className="flex min-h-screen flex-col items-center p-8 gap-6">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-4">Analyses</h1>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-2">Query</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Report</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items?.length ? (
                items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="px-4 py-2 max-w-[28rem] truncate">{it.query}</td>
                    <td className="px-4 py-2 capitalize text-muted-foreground">
                      {it.classification || "-"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "inline-flex items-center gap-2 rounded-full border px-2 py-0.5 " +
                          (it.status === "completed"
                            ? "text-green-600"
                            : it.status === "failed"
                            ? "text-red-600"
                            : "text-amber-600")
                        }
                      >
                        {it.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs " +
                          (it.reportReady ? "text-green-600" : "text-muted-foreground")
                        }
                      >
                        {it.reportReady ? "Ready" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {it.updatedAt ? new Date(it.updatedAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/analysis/${it.id}`}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    No analyses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
