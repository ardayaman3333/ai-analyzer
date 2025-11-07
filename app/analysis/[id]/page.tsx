"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Analysis = {
  id: string;
  query: string;
  status: string;
  result: any | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export default function AnalysisDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const res = await fetch(`/api/analyses/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e?.message || "Fetch error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (data && (data.status === "completed" || data.status === "failed")) return;
      load();
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const status = data?.status ?? (loading ? "loading" : "unknown");
  const result = data?.result ?? {};

  const insights = useMemo(
    () => ({
      primaryDomain: result?.insights?.primaryDomain || null,
      aliases: (result?.insights?.aliases as string[]) || [],
      socials: (result?.insights?.socials as Record<string, string[]>) || {},
      contactPages: (result?.insights?.contactPages as string[]) || [],
      pricingPages: (result?.insights?.pricingPages as string[]) || [],
      emails: (result?.insights?.emails as string[]) || [],
      phones: (result?.insights?.phones as string[]) || [],
      locations: (result?.insights?.locations as string[]) || [],
      domainHighlights:
        (result?.insights?.domainHighlights as Array<{ domain: string; count: number }>) || [],
    }),
    [result]
  );

  const report = result?.report as
    | {
        overview: string;
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
        digitalScore: number;
        authorityScore: number;
        recommendedAIProducts: string[];
      }
    | undefined;

  async function generateReport(force = false) {
    try {
      setReportError(null);
      setReportLoading(true);
      const res = await fetch(`/api/analyses/${id}/summarize${force ? "?force=true" : ""}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e: any) {
      setReportError(e?.message || "Report error");
    } finally {
      setReportLoading(false);
    }
  }

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString() : "-";

  const expandedQueries = Array.isArray(result.expandedQueries) ? result.expandedQueries : [];
  const samples = Array.isArray(result.samples) ? result.samples : [];
  const classificationType = result?.classification?.type ?? "unknown";
  const company = result?.company;
  const person = result?.person;

  const statusBadge =
    status === "completed"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "failed"
      ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
      : "border-amber-500/30 bg-amber-500/10 text-amber-300";

  const summaryStats = [
    { label: "Query", value: data?.query ?? (loading ? "Loading..." : "-") },
    { label: "Created", value: formatDate(data?.createdAt) },
    { label: "Updated", value: formatDate(data?.updatedAt) },
    { label: "Type", value: classificationType },
  ];

  const handleSummary = () => generateReport(Boolean(report));

  return (
    <main className="relative min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_60%),radial-gradient(circle_at_80%_0,_rgba(248,113,113,0.12),_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Analysis detail</p>
              <h1 className="mt-4 text-4xl font-semibold">Signal breakdown</h1>
              <p className="mt-2 text-sm text-slate-300">
                ID: <span className="font-mono text-xs">{id}</span>
              </p>
              {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <span className={`inline-flex items-center rounded-full border px-4 py-1 text-sm font-semibold ${statusBadge}`}>
                {status}
              </span>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <a
                  href={`/api/analyses/${id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white hover:text-white"
                >
                  Download PDF
                </a>
                <div className="flex items-center">
                  <Button
                    size="sm"
                    onClick={handleSummary}
                    disabled={reportLoading || status !== "completed"}
                    className="w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500 text-white hover:opacity-90"
                  >
                    {reportLoading ? "Working..." : report ? "Regenerate summary" : "Generate summary"}
                  </Button>
                </div>
              </div>
              {reportError && <p className="text-xs text-rose-400">{reportError}</p>}
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Signal map</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Insights</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Primary domain</p>
              {insights.primaryDomain ? (
                <a
                  href={`https://${insights.primaryDomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-lg font-semibold text-white underline-offset-2 hover:underline"
                >
                  {insights.primaryDomain}
                </a>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Not detected</p>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Aliases</p>
              {insights.aliases.length ? (
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-200">
                  {insights.aliases.map((alias, idx) => (
                    <span key={idx} className="rounded-full border border-white/20 px-3 py-1">
                      {alias}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No alternate names detected yet.</p>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Social channels</p>
              {Object.keys(insights.socials).length ? (
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-200">
                  {Object.entries(insights.socials).map(([platform, links]) => (
                    <span key={platform} className="rounded-full border border-white/20 px-3 py-1">
                      {platform}: {links.length}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No public social accounts were detected.</p>
              )}
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { label: "Emails", values: insights.emails },
              { label: "Phones", values: insights.phones },
              { label: "Locations", values: insights.locations },
            ].map((block) => (
              <div key={block.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{block.label}</p>
                {block.values.length ? (
                  <ul className="mt-2 space-y-1">
                    {block.values.slice(0, 6).map((value, index) => (
                      <li key={index} className="break-all text-white/90">
                        {value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-slate-400">
                    {block.label === "Emails"
                      ? "No public email addresses discovered."
                      : block.label === "Phones"
                      ? "No phone numbers available yet."
                      : "No geographic hints surfaced so far."}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { label: "Contact pages", values: insights.contactPages },
              { label: "Pricing pages", values: insights.pricingPages },
            ].map((block) => (
              <div key={block.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{block.label}</p>
                {block.values.length ? (
                  <ul className="mt-2 space-y-2">
                    {block.values.map((url, index) => (
                      <li key={index} className="break-all">
                        <a href={url} target="_blank" rel="noreferrer" className="text-sky-200 underline-offset-2 hover:underline">
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-slate-400">
                    {block.label === "Contact pages"
                      ? "No contact endpoints captured yet."
                      : "Pricing transparency not discovered."}
                  </p>
                )}
              </div>
            ))}
          </div>
          {insights.domainHighlights.length ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Top mentioned domains</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/90">
                {insights.domainHighlights.map((item, idx) => (
                  <span key={idx} className="rounded-full border border-white/20 px-3 py-1">
                    {item.domain} ({item.count})
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {Object.keys(insights.socials).length ? (
            <details className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <summary className="cursor-pointer text-xs uppercase tracking-[0.3em] text-slate-400">
                View social links
              </summary>
              <div className="mt-3 space-y-4">
                {Object.entries(insights.socials).map(([platform, urls]) => (
                  <div key={platform}>
                    <p className="font-semibold text-white">{platform}</p>
                    <ul className="mt-1 space-y-1">
                      {urls.map((url, index) => (
                        <li key={index} className="break-all text-slate-300">
                          <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Classification layer</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Entity profile</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Type</p>
              <p className="mt-2 text-lg font-semibold text-white">{classificationType}</p>
              {typeof result?.classification?.confidence === "number" && (
                <p className="text-sm text-slate-300">
                  Confidence: {(result.classification.confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Aliases detected</p>
              <p className="mt-2 text-lg font-semibold text-white">{insights.aliases.length || "-"}</p>
            </div>
          </div>

          {classificationType === "company" && company && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Logo</p>
                {company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logoUrl} alt="logo" className="mt-3 h-12 w-12 rounded border border-white/10 bg-white/80 object-contain p-2" />
                ) : (
                  <p className="mt-2 text-sm text-slate-400">-</p>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Sectors</p>
                {Array.isArray(company.sectors) && company.sectors.length ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-200">
                    {company.sectors.map((sector: string, idx: number) => (
                      <span key={idx} className="rounded-full border border-white/20 px-3 py-1">
                        {sector}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">-</p>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Services</p>
                {Array.isArray(company.services) && company.services.length ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-200">
                    {company.services.map((svc: string, idx: number) => (
                      <span key={idx} className="rounded-full border border-white/20 px-3 py-1">
                        {svc}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">-</p>
                )}
              </div>
            </div>
          )}

          {classificationType === "person" && person && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Titles</p>
                {Array.isArray(person.titles) && person.titles.length ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-200">
                    {person.titles.map((title: string, idx: number) => (
                      <span key={idx} className="rounded-full border border-white/20 px-3 py-1">
                        {title}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">-</p>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Locations</p>
                {insights.locations.length ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-200">
                    {insights.locations.map((loc, idx) => (
                      <span key={idx} className="rounded-full border border-white/20 px-3 py-1">
                        {loc}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">-</p>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Emails</p>
                {insights.emails.length ? (
                  <div className="mt-2 space-y-1 text-sm text-slate-200">
                    {insights.emails.slice(0, 4).map((email, idx) => (
                      <div key={idx}>{email}</div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">-</p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Executive summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">AI-written synopsis</h2>
            </div>
            {report && (
              <div className="flex gap-3 text-sm text-slate-300">
                <div className="rounded-full border border-white/20 px-3 py-1">Digital score: {report.digitalScore ?? "-"}</div>
                <div className="rounded-full border border-white/20 px-3 py-1">Authority score: {report.authorityScore ?? "-"}</div>
              </div>
            )}
          </div>
          {report ? (
            <div className="mt-6 space-y-6">
              <p className="text-base text-slate-200">{report.overview || "No overview provided."}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: "Strengths", items: report.strengths },
                  { title: "Weaknesses", items: report.weaknesses },
                  { title: "Opportunities", items: report.opportunities },
                  { title: "Threats", items: report.threats },
                ].map((block) => (
                  <div key={block.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{block.title}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-200">
                      {block.items?.length ? block.items.map((item, idx) => <li key={idx}>{item}</li>) : <li>-</li>}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Recommended AI products</p>
                {report.recommendedAIProducts?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-200">
                    {report.recommendedAIProducts.map((rec, idx) => (
                      <span key={idx} className="rounded-full border border-white/20 px-3 py-1">
                        {rec}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-slate-400">-</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-slate-300">
              {status !== "completed"
                ? "Summary will be available once the analysis is completed."
                : "Generate the executive summary to see GPT insights here."}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Query expansion</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Related search inventory</h2>
          {expandedQueries.length ? (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-200">
              {expandedQueries.map((query: string, idx: number) => (
                <li key={idx}>{query}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No expanded queries captured.</p>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Top web results</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Source mapping</h2>
          {samples.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm text-slate-200">
                <thead className="bg-white/5 text-left text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">URL</th>
                    <th className="px-3 py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((sample: any, idx: number) => (
                    <tr key={idx} className="border-t border-white/10 align-top">
                      <td className="px-3 py-2 font-semibold">{sample.title || "-"}</td>
                      <td className="px-3 py-2 break-all text-sky-200">
                        {sample.url ? (
                          <a href={sample.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                            {sample.url}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{sample.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No search samples recorded.</p>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <details>
            <summary className="cursor-pointer text-xs uppercase tracking-[0.3em] text-slate-300">
              Raw JSON
            </summary>
            <pre className="mt-4 max-h-[32rem] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-slate-200">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </section>

        <div className="flex flex-wrap justify-between text-sm text-slate-400">
          <Link href="/" className="underline-offset-2 hover:text-white">
            New analysis
          </Link>
          <Link href="/analyses" className="underline-offset-2 hover:text-white">
            All analyses
          </Link>
        </div>
      </div>
    </main>
  );
}
