/* app/api/analyze/route.ts (LOKAL TEST DÜZELTMELİ) */

import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

// Not: process.env.NODE_ENV 'development' (lokal) veya 'production' (canlı) olur
const isDevelopment = process.env.NODE_ENV === 'development';

const qstashClient = new Client({
  token: process.env.UPSTASH_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. Veritabanına kaydet (Bu her zaman çalışır)
    const result = await sql`
      INSERT INTO analyses (query, status)
      VALUES (${query}, 'pending')
      RETURNING id;
    `;

    const analysisId = result.rows[0].id;

    // 2. YENİ KURAL: EĞER LOKALDE (localhost) DEĞİLSEK POSTACIYI ÇAĞIR
    if (!isDevelopment) {
      // Adresin 'https://' ile başlamasını garanti et
      const baseUrl = `https://${process.env.VERCEL_URL}`;

      await qstashClient.publishJSON({
        url: `${baseUrl}/api/process`, 
        body: {
          analysisId: analysisId,
          query: query
        },
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
      });
    }
    // Lokal geliştirirken QStash kullanmıyorsak, işlemi doğrudan tetikle
    if (isDevelopment) {
      try {
        const origin = new URL(request.url).origin;
        await fetch(`${origin}/api/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisId, query }),
        });
      } catch (e) {
        console.warn("Local process trigger failed", e);
      }
    }
    // Eğer lokaldeysek (isDevelopment true ise), bu 'if' bloğunu
    // tamamen atlar ve QStash'i HİÇ çağırmaz.

    // 3. Kullanıcıya "Sipariş alındı" de
    return NextResponse.json({ 
      message: `Talep Alındı! ${isDevelopment ? '(Lokal Test)' : ''}`, 
      analysisId: analysisId 
    }, { status: 200 });

  } catch (error) {
    console.error(error); // Hata olursa terminale yaz
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
