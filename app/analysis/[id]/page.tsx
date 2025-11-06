"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

  const insights = useMemo(() => ({
    primaryDomain: result?.insights?.primaryDomain || null,
    aliases: (result?.insights?.aliases as string[]) || [],
    socials: (result?.insights?.socials as Record<string, string[]>) || {},
    contactPages: (result?.insights?.contactPages as string[]) || [],
    pricingPages: (result?.insights?.pricingPages as string[]) || [],
    emails: (result?.insights?.emails as string[]) || [],
    phones: (result?.insights?.phones as string[]) || [],
    locations: (result?.insights?.locations as string[]) || [],
    domainHighlights: (result?.insights?.domainHighlights as Array<{ domain: string; count: number }>) || [],
  }), [result]);

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

  return (
    <main className="flex min-h-screen flex-col items-center p-8 gap-6">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analysis</h1>
            <div className="mt-1 text-sm text-muted-foreground">ID</div>
            <div className="font-mono text-xs break-all">{id}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Status</div>
            <span className={
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm " +
              (status === "completed" ? "text-green-600" : status === "failed" ? "text-red-600" : "text-amber-600")
            }>
              {status}
            </span>
          </div>
        </div>

        <div className="rounded-lg border p-4 bg-card text-card-foreground">
          <div className="text-sm text-muted-foreground">Query</div>
          <div className="font-medium">{data?.query ?? "-"}</div>
        </div>

        {/* Insights */}
        <section className="rounded-lg border p-4 bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-3">Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Primary Domain</div>
              <div className="text-sm break-all">
                {insights.primaryDomain ? (
                  <a href={`https://${insights.primaryDomain}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {insights.primaryDomain}
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Aliases</div>
              {insights.aliases?.length ? (
                <div className="flex flex-wrap gap-2">
                  {insights.aliases.map((a, i) => (
                    <span key={i} className="rounded-full border px-2 py-0.5 text-xs">{a}</span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Socials</div>
              {Object.keys(insights.socials).length ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(insights.socials).map(([k, arr]) => (
                    <span key={k} className="rounded-full border px-2 py-0.5 text-xs">
                      {k}: {arr.length}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Emails</div>
              {insights.emails.length ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {insights.emails.slice(0, 4).map((mail, i) => (
                    <li key={i}>{mail}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Phones</div>
              {insights.phones.length ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {insights.phones.slice(0, 4).map((phone, i) => (
                    <li key={i}>{phone}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Locations</div>
              {insights.locations.length ? (
                <div className="flex flex-wrap gap-2">
                  {insights.locations.map((loc, i) => (
                    <span key={i} className="rounded-full border px-2 py-0.5 text-xs">{loc}</span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Contact Pages</div>
              {insights.contactPages.length ? (
                <ul className="list-disc list-inside text-sm">
                  {insights.contactPages.map((u, i) => (
                    <li key={i} className="break-all">
                      <a className="underline underline-offset-2" href={u} target="_blank" rel="noreferrer">
                        {u}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Pricing Pages</div>
              {insights.pricingPages.length ? (
                <ul className="list-disc list-inside text-sm">
                  {insights.pricingPages.map((u, i) => (
                    <li key={i} className="break-all">
                      <a className="underline underline-offset-2" href={u} target="_blank" rel="noreferrer">
                        {u}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          </div>

          {insights.domainHighlights.length ? (
            <div className="mt-4 text-sm">
              <div className="text-sm text-muted-foreground mb-1">Top Domains Mentioned</div>
              <div className="flex flex-wrap gap-2">
                {insights.domainHighlights.map((item, i) => (
                  <span key={i} className="rounded-full border px-2 py-0.5 text-xs">
                    {item.domain} ({item.count})
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {Object.keys(insights.socials).length ? (
            <div className="mt-3 text-sm">
              <details>
                <summary className="cursor-pointer text-muted-foreground">View social links</summary>
                <div className="mt-2 space-y-2">
                  {Object.entries(insights.socials).map(([k, arr]) => (
                    <div key={k}>
                      <div className="font-medium mb-1">{k}</div>
                      <ul className="list-disc list-inside space-y-1">
                        {arr.map((u, i) => (
                          <li key={i} className="break-all">
                            <a href={u} target="_blank" rel="noreferrer" className="underline underline-offset-2">{u}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ) : null}
        </section>

        {/* Classification */}
        <section className="rounded-lg border p-4 bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-3">Classification</h2>
          <div className="text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>{" "}
              <span className="font-medium">{result?.classification?.type ?? "unknown"}</span>
            </div>
            {typeof result?.classification?.confidence === "number" && (
              <div className="text-muted-foreground">Confidence: {(result.classification.confidence * 100).toFixed(0)}%</div>
            )}
          </div>
        </section>

        {/* Company Profile */}
        {result?.classification?.type === "company" && (
          <section className="rounded-lg border p-4 bg-card text-card-foreground">
            <h2 className="text-lg font-semibold mb-3">Company Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Logo</div>
                {result?.company?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.company.logoUrl} alt="logo" className="h-10 w-10" />
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Sectors</div>
                {Array.isArray(result?.company?.sectors) && result.company.sectors.length ? (
                  <div className="flex flex-wrap gap-2">
                    {result.company.sectors.map((s: string, i: number) => (
                      <span key={i} className="rounded-full border px-2 py-0.5 text-xs">{s}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Services</div>
                {Array.isArray(result?.company?.services) && result.company.services.length ? (
                  <div className="flex flex-wrap gap-2">
                    {result.company.services.map((s: string, i: number) => (
                      <span key={i} className="rounded-full border px-2 py-0.5 text-xs">{s}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Contact Pages</div>
                {Array.isArray(result?.company?.contactPages) && result.company.contactPages.length ? (
                  <ul className="list-disc list-inside text-sm">
                    {result.company.contactPages.map((u: string, i: number) => (
                      <li key={i} className="break-all"><a className="underline underline-offset-2" href={u} target="_blank" rel="noreferrer">{u}</a></li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Pricing Pages</div>
                {Array.isArray(result?.company?.pricingPages) && result.company.pricingPages.length ? (
                  <ul className="list-disc list-inside text-sm">
                    {result.company.pricingPages.map((u: string, i: number) => (
                      <li key={i} className="break-all"><a className="underline underline-offset-2" href={u} target="_blank" rel="noreferrer">{u}</a></li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Person Profile */}
        {result?.classification?.type === "person" && (
          <section className="rounded-lg border p-4 bg-card text-card-foreground">
            <h2 className="text-lg font-semibold mb-3">Person Profile</h2>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Possible Titles</div>
              {Array.isArray(result?.person?.titles) && result.person.titles.length ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {result.person.titles.map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          </section>
        )}

        {/* Executive Summary */}
        <section className="rounded-lg border p-4 bg-card text-card-foreground">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Executive Summary</h2>
            {!report && (
              <button
                className="rounded-md border bg-background px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                disabled={reportLoading || status !== "completed"}
                onClick={() => generateReport(false)}
              >
                {reportLoading ? "Generating..." : "Generate Report"}
              </button>
            )}
          </div>
          {reportError && (
            <div className="text-red-600 text-sm mb-2">{reportError}</div>
          )}
          {report ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Overview</div>
                <p className="text-sm leading-relaxed">{report.overview}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium">Strengths</div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {(report.strengths || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-medium">Weaknesses</div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {(report.weaknesses || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-medium">Opportunities</div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {(report.opportunities || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-medium">Threats</div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {(report.threats || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-md border p-3">
                  <div className="text-sm text-muted-foreground">Digital Score</div>
                  <div className="text-2xl font-semibold">{report.digitalScore ?? "-"}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-sm text-muted-foreground">Authority Score</div>
                  <div className="text-2xl font-semibold">{report.authorityScore ?? "-"}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-sm text-muted-foreground">AI Recommendations</div>
                  <div className="text-sm text-muted-foreground">
                    {(report.recommendedAIProducts || []).slice(0, 3).join(", ") || "-"}
                  </div>
                </div>
              </div>
              <div>
                <button
                  className="rounded-md border bg-background px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => generateReport(true)}
                >
                  Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {status !== "completed"
                ? "Report will be available after processing completes."
                : "Click Generate Report to create an executive summary."}
            </div>
          )}
        </section>

        {/* Expanded Queries */}
        <section className="rounded-lg border p-4 bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-3">Expanded Queries</h2>
          {Array.isArray(result.expandedQueries) && result.expandedQueries.length ? (
            <ul className="list-disc list-inside space-y-1 text-sm">
              {result.expandedQueries.map((q: string, i: number) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">-</div>
          )}
        </section>

        {/* Top Results */}
        <section className="rounded-lg border p-4 bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-3">Top Results</h2>
          {Array.isArray(result.samples) && result.samples.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">URL</th>
                    <th className="px-3 py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {result.samples.map((r: any, i: number) => (
                    <tr key={i} className="border-t align-top">
                      <td className="px-3 py-2 min-w-[12rem]">{r.title || "-"}</td>
                      <td className="px-3 py-2 min-w-[16rem] break-all">
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{r.url}</a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[40rem]">{r.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">-</div>
          )}
        </section>

        {/* Raw JSON */}
        <section className="rounded-lg border p-4 bg-card text-card-foreground">
          <details>
            <summary className="cursor-pointer text-lg font-semibold">Raw JSON</summary>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            {loading && !data ? (
              <div className="text-sm mt-2">Loading...</div>
            ) : (
              <pre className="text-xs whitespace-pre-wrap break-words bg-muted/30 p-3 rounded-md border mt-3">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </details>
        </section>

        <div className="flex justify-between text-sm">
          <Link href="/" className="underline underline-offset-2 text-muted-foreground hover:text-foreground">New analysis</Link>
          <Link href="/analyses" className="underline underline-offset-2 text-muted-foreground hover:text-foreground">All analyses</Link>
        </div>
      </div>
    </main>
  );
}
