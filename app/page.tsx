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
    description: "Alias, domain, pricing ve sosyal ayak izlerini tek akışta toparla.",
  },
  {
    tag: "Insight",
    title: "Company & talent lens",
    description: "Kurum ya da kişi profillerini sektör, hizmet ve kariyer katmanında ayrıştır.",
  },
  {
    tag: "Action",
    title: "AI-ready opportunities",
    description: "Pain point haritasına göre teklif edilebilir yapay zeka çözümlerini öner.",
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
      setMessage("Lütfen analiz edilecek bir marka, kişi veya kurum adı girin.");
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
        throw new Error("Sunucuda bir hata oluştu.");
      }

      const result = await response.json();
      setMessage(`Talep alındı. Analiz ID: ${result.analysisId}`);
      setMessageType("success");
      setQuery("");

      if (result?.analysisId) {
        router.push(`/analysis/${result.analysisId}`);
      }
    } catch (error) {
      setMessage("Analiz talebi gönderilemedi. Lütfen tekrar deneyin.");
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
                web üzerindeki tüm sinyalleri tek raporda toplar.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Marka, kurum veya kişiye dair açık-web verilerini tarayıp Firecrawl, Brave Search ve
              OpenAI zinciriyle anlamlı içgörülere dönüştürür. Kurumsal kararlar için production-ready analizler.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-widest text-slate-300">Yeni analiz başlat</p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <Input
                  type="text"
                  placeholder="Örn: 'VisionFast AI Solutions'"
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
                  {isLoading ? "Analiz ediliyor..." : "Analize Başla"}
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
                Çoklu analiz kuyruğu
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
                  Brave Search sonuçları, Firecrawl taramaları ve OpenAI özetleyicisi tek raporda toplanır.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-slate-400">Durum</p>
                  <p className="text-lg font-semibold text-white">Asenkron</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-slate-400">Teslim</p>
                  <p className="text-lg font-semibold text-white">PDF + Dashboard</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                “NexusAI, dijital otoriteyi skorlayıp SWOT + AI çözüm planını birlikte sunar.”
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
      </div>
    </main>
  );
}
