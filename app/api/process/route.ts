/* app/api/process/route.ts (TAMAMEN DÜZELTİLMİŞ HALİ) */

import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
// 1. DÜZELTME: "verifySignatureAppRouter" (T ile)
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

// Güvenlik Görevlisi Fonksiyonu: "Gelen kişi Postacı mı?"
async function handler(request: Request) {
  // 1. Gelen mektubu (body) oku
  const body = await request.json();
  const { analysisId, query } = body;

  if (!analysisId || !query) {
    return NextResponse.json({ error: "Missing analysisId or query" }, { status: 400 });
  }

  try {
    // 2. DURUM GÜNCELLE: "BEKLİYOR" -> "ÇALIŞIYOR"
    await sql`
      UPDATE analyses
      SET status = 'running', updated_at = NOW()
      WHERE id = ${analysisId};
    `;

    // --- BURASI GELECEKTE TÜM AĞIR İŞLERİN OLDUĞU YER ---
    console.log(`İŞLEM BAŞLADI: ${query} (ID: ${analysisId})`);
    
    // Simülasyon: 5 saniye boyunca ağır bir iş yapıyormuş gibi yap
    await new Promise(resolve => setTimeout(resolve, 5000)); 
    
    const fakeResult = {
      message: `Analiz tamamlandı: ${query}`,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`İŞLEM BİTTİ: ${query} (ID: ${analysisId})`);
    // --- AĞIR İŞ BİTTİ ---

    // 3. DURUM GÜNCELLE: "ÇALIŞIYOR" -> "TAMAMLANDI"
    await sql`
      UPDATE analyses
      SET status = 'completed', 
          result = ${JSON.stringify(fakeResult)}::jsonb, 
          updated_at = NOW()
      WHERE id = ${analysisId};
    `;

    return NextResponse.json({ success: true, analysisId: analysisId }, { status: 200 });

  } catch (error) {
    console.error("Atölyede hata:", error);
    
    await sql`
      UPDATE analyses
      SET status = 'failed', updated_at = NOW()
      WHERE id = ${analysisId};
    `;
    
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

// 2. DÜZELTME: "verifySignatureAppRouter" (T ile)
export const POST = verifySignatureAppRouter(handler, {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});