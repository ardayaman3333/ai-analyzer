/* app/api/analyze/route.ts (Yeni Görevi: Postacıya Mektup Ver) */

import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash"; // Postacı Kütüphanesini çağır

// Posta Ofisini (QStash) ayarla
const qstashClient = new Client({
  token: process.env.UPSTASH_TOKEN!, // .env.local'dan şifreyi al
});

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. ÖNCE siparişi veritabanına "bekliyor" olarak kaydet (Bu aynı)
    const result = await sql`
      INSERT INTO analyses (query, status)
      VALUES (${query}, 'pending')
      RETURNING id;
    `;

    const analysisId = result.rows[0].id; // Sipariş ID'sini al

    // 2. ŞİMDİ "Postacıya" (QStash) mektubu ver
    await qstashClient.publishJSON({
      // "Atölye" adresimiz burası olacak (daha oluşturmadık)
      url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/process`,

      // Mektubun içine sipariş ID'sini koy
      body: {
        analysisId: analysisId,
        query: query
      },

      // Güvenlik anahtarları (bu önemli)
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    // 3. Kullanıcıya "Sipariş alındı" de (Bu da aynı)
    return NextResponse.json({ 
      message: "Analysis request received", 
      analysisId: analysisId 
    }, { status: 200 });

  } catch (error) {
    console.error(error);

    // Postacıya mektup verirken hata olursa
    if (error instanceof Error && error.message.includes('QStash')) {
         return NextResponse.json({ error: "Failed to queue analysis job." }, { status: 500 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}