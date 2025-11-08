import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";
import { cookies } from "next/headers";

const isDevelopment = process.env.NODE_ENV === "development";

const qstashClient = new Client({
  token: process.env.UPSTASH_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionId = cookieStore.get("nexus_session")?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO analyses (query, status, session_id)
      VALUES (${query}, 'pending', ${sessionId})
      RETURNING id;
    `;

    const analysisId = result.rows[0].id;

    if (!isDevelopment) {
      const baseUrl = `https://${process.env.VERCEL_URL}`;
      await qstashClient.publishJSON({
        url: `${baseUrl}/api/process`,
        body: { analysisId, query },
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
      });
    } else {
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

    return NextResponse.json(
      {
        message: `Request accepted ${isDevelopment ? "(Local Test)" : ""}`,
        analysisId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
