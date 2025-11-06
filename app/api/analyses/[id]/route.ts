import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

type AnalysisRow = {
  id: string;
  query: string;
  status: string;
  result: any | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;

  try {
    const resolved = await context.params;
    id = resolved?.id;
  } catch {
    id = undefined;
  }

  if (!id) {
    try {
      const url = new URL(request.url);
      const parts = url.pathname.split("/").filter(Boolean);
      id = parts[parts.length - 1] || parts[parts.length - 2];
    } catch {}
  }

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const { rows } = await sql<AnalysisRow>`
      SELECT id, query, status, result, created_at, updated_at
      FROM analyses
      WHERE id::text = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = rows[0];
    const parsedResult = typeof row.result === "string" ? JSON.parse(row.result) : row.result;

    return NextResponse.json(
      {
        id: row.id,
        query: row.query,
        status: row.status,
        result: parsedResult ?? null,
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
