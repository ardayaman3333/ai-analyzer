import { headers } from "next/headers";
import { AnalysesBoard } from "@/components/analyses/AnalysesBoard";

async function fetchAnalyses() {
  const hdrs = await headers();
  const getHeader = (name: string) => {
    const lower = name.toLowerCase();
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
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <AnalysesBoard items={items} />
    </main>
  );
}
