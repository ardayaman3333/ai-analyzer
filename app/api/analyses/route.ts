import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10) || 0;

  try {
    const { rows } = await sql`
      SELECT
        id,
        query,
        status,
        created_at,
        updated_at,
        result -> 'classification' ->> 'type' AS classification_type,
        result -> 'report' AS report_payload
      FROM analyses
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return NextResponse.json(
      rows.map((r: any) => ({
        id: r.id,
        query: r.query,
        status: r.status,
        createdAt: r.created_at ?? null,
        updatedAt: r.updated_at ?? null,
        classification: r.classification_type ?? null,
        reportReady: r.report_payload != null,
      })),
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/analyses error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
