/* app/page.tsx */
// Vercel'i yeniden başlatmaya zorla v11

"use client"; // Sayfanın interaktif (tıklanabilir) olmasını sağlar

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Input'u (yazı kutusu) aldık
// useToast'ı (bildirim) kullanamıyoruz, o yüzden sildik

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Bildirim (toast) yerine bu iki durumu (state) kullanacağız:
  const [message, setMessage] = useState(""); // Gösterilecek mesaj
  const [messageType, setMessageType] = useState(""); // Mesajın türü (hata mı, başarı mı?)

  const handleSubmit = async () => {
    // Bir önceki mesajı temizle
    setMessage("");
    setMessageType("");

    if (!query) {
      setMessage("Lütfen analiz edilecek bir marka adı girin.");
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
        body: JSON.stringify({ query: query }),
      });

      if (!response.ok) {
        throw new Error("Sunucuda bir hata oluştu.");
      }

      const result = await response.json();

      // Başarılı olursa mesajı ayarla
      setMessage(`Talep Alındı! Analiz ID: ${result.analysisId}`);
      setMessageType("success");
      setQuery(""); // Kutuyu temizle
      if (result?.analysisId) {
        router.push(`/analysis/${result.analysisId}`);
      }

    } catch (error) {
      // Hata olursa mesajı ayarla
      setMessage("Analiz talebi gönderilemedi. Lütfen tekrar deneyin.");
      setMessageType("error");
    }

    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          NexusAI Analyzer
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Markanız için derinlemesine web analizi.
        </p>

        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Örn: 'Apple' veya 'Tesla'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
          <Button 
            size="lg" 
            onClick={handleSubmit} 
            disabled={isLoading}
          >
            {isLoading ? "Analiz ediliyor..." : "Analize Başla"}
          </Button>
        </div>

        {/* BİLDİRİM YERİNE KULLANACAĞIMIZ MESAJ ALANI */}
        {message && (
          <div className={`mt-4 text-sm font-medium ${
              messageType === "error" ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </div>
        )}

      </div>
    </main>
  );
}
