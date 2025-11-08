/* app/page.tsx */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HighlightCard = {
  title: string;
  description: string;
  tag: string;
};

const highlightCards: HighlightCard[] = [
  {
    tag: "Discovery",
    title: "Web intelligence graph",
    description: "Collect aliases, domains, pricing hints and social footprint in one flow.",
  },
  {
    tag: "Insight",
    title: "Company & talent lens",
    description: "Split company vs. talent signals across sector, service and career layers.",
  },
  {
    tag: "Action",
    title: "AI-ready opportunities",
    description: "Map the pain points and surface AI solutions worth pitching.",
  },
];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");

  const handleSubmit = async () => {
    setMessage("");
    setMessageType("");

    if (!query.trim()) {
      setMessage("Please enter a brand, person or organization to analyze.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error("Server returned an error.");
      }

      const result = await response.json();
      setMessage(`Request accepted. Analysis ID: ${result.analysisId}`);
      setMessageType("success");
      setQuery("");

      if (result?.analysisId) {
        router.push(`/analysis/${result.analysisId}`);
      }
    } catch (error) {
      setMessage("Analysis request failed. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_55%),radial-gradient(circle_at_20%_20%,_rgba(129,140,248,0.2),_transparent_45%),radial-gradient(circle_at_80%_0%,_rgba(248,113,113,0.15),_transparent_50%)]" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16 lg:py-24">
        <section className="grid items-center gap-12 lg:grid-cols-[1.15fr,0.85fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
              Realtime brand intelligence
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              <span className="block bg-gradient-to-r from-sky-300 via-indigo-300 to-pink-300 bg-clip-text text-transparent">
                NexusAI
              </span>
              <span className="mt-2 block text-slate-200">
                unifies every public signal in a single report.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Crawl public web data for brands, companies or people using Brave Search and
              OpenAI chains to craft decision-ready intelligence.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-widest text-slate-300">Start a fresh analysis</p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <Input
                  type="text"
                  placeholder="e.g. “VisionFast AI Solutions”"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading}
                  className="bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-sky-300"
                />
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90 md:w-auto"
                >
                  {isLoading ? "Processing..." : "Run analysis"}
                </Button>
              </div>

              {message && (
                <div
                  className={`mt-4 text-sm font-medium ${
                    messageType === "error" ? "text-rose-400" : "text-emerald-300"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-300">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Parallel analysis queue
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Executive summary + PDF
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Postgres + Vercel ready
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-2xl shadow-sky-500/10 backdrop-blur">
            <div className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Pipeline</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Web → Insights → Strategy</h3>
                <p className="mt-3 text-sm text-slate-300">
                  Brave Search, Firecrawl crawls and OpenAI summaries collapse into a single playbook.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-slate-400">Mode</p>
                  <p className="text-lg font-semibold text-white">Asynchronous</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-slate-400">Delivery</p>
                  <p className="text-lg font-semibold text-white">PDF + Dashboard</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                “NexusAI scores digital authority and ships SWOT + AI playbooks together.”
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {highlightCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-white/30"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                {card.tag}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{card.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Help / SSS</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Sonuçlar beklediğin gibi değilse?</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 text-sm text-slate-200">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white">Sorgunu zenginleştir</h3>
              <p>Marka adı + şehir/ülke + ürün/hizmet anahtar kelimesi kullan. Örn: “VisionFast AI Solutions İstanbul pricing”.</p>
              <p>Farklı varyasyonlar Brave sonuçlarını çeşitlendirir ve daha fazla sinyal yakalar.</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white">Analizi yenile</h3>
              <p>Detay sayfasındaki “Regenerate summary” butonu yeni sinyalleri toplar.</p>
              <p>İstersen aynı sorguyu silip tekrar gönderebilirsin; queue tamamen yeniden çalışır.</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white">Trace’i kontrol et</h3>
              <p>“Deep search trace” alanı hangi sorgudan hangi domain/sinyaller geldiğini gösterir.</p>
              <p>Eksik kaynak görürsen yeni anahtar kelime veya manuel domain ekle.</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white">Destek</h3>
              <p>Analiz <em>failed</em> olursa API anahtarlarını doğrula ve tekrar dene.</p>
              <p>Hâlâ sorun varsa trace log’unu göndererek bize ulaş.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
