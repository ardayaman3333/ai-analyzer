import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(
  req: NextRequest,
  ctx: { params?: { id?: string } }
) {
  let id = ctx?.params?.id;
  if (!id) {
    try {
      const url = new URL(req.url);
      const parts = url.pathname.split("/");
      id = parts[parts.length - 1] || parts[parts.length - 2];
    } catch {}
  }
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    // Avoid casting the param to UUID to prevent 22P02 on non-UUID ids
    const { rows } = await sql`
      SELECT id, query, status, result, created_at, updated_at
      FROM analyses
      WHERE id::text = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = rows[0] as any;
    return NextResponse.json(
      {
        id: row.id,
        query: row.query,
        status: row.status,
        result: row.result ?? null,
        createdAt: row.created_at ?? null,
        updatedAt: row.updated_at ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/analyses/[id] error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
