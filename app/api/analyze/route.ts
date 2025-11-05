/* app/api/analyze/route.ts (https:// DÜZELTMESİ) */

import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

const qstashClient = new Client({
  token: process.env.UPSTASH_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. Veritabanına kaydet (Bu zaten çalışıyordu)
    const result = await sql`
      INSERT INTO analyses (query, status)
      VALUES (${query}, 'pending')
      RETURNING id;
    `;
    
    const analysisId = result.rows[0].id;

    // --- BURASI DÜZELTİLDİ ---
    // Adresin 'https://' ile başlamasını garanti et
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` // Vercel'deyse (Canlıda)
      : 'http://localhost:3000';           // Lokal'deyse
    // --- DÜZELTME BİTTİ ---

    // 2. "Postacıya" (QStash) mektubu ver
    await qstashClient.publishJSON({
      // Düzeltilmiş 'baseUrl' değişkenini kullan
      url: `${baseUrl}/api/process`, 
      
      body: {
        analysisId: analysisId,
        query: query
      },
      
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    // 3. Kullanıcıya "Sipariş alındı" de
    return NextResponse.json({ 
      message: "Analysis request received", 
      analysisId: analysisId 
    }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}