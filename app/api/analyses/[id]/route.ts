import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";

type AnalysisRow = {
  id: string;
  query: string;
  status: string;
  result: any | null;
  created_at: string | null;
  updated_at: string | null;
  session_id: string | null;
};

type RouteContext = { params: Promise<{ id: string }> };

async function resolveId(request: NextRequest, params: RouteContext["params"]) {
  try {
    const resolved = await params;
    if (resolved?.id) return resolved.id;
  } catch {
    // fall-through
  }

  try {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || parts[parts.length - 2];
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  const id = await resolveId(request, ctx.params);

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("nexus_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session" }, { status: 401 });
  }

  try {
    const { rows } = await sql<AnalysisRow>`
      SELECT id, query, status, result, created_at, updated_at, session_id
      FROM analyses
      WHERE id::text = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = rows[0];
    if (row.session_id !== sessionId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
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

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const id = await resolveId(request, ctx.params);

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("nexus_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session" }, { status: 401 });
  }

  try {
    const result = await sql`
      DELETE FROM analyses
      WHERE id::text = ${id} AND session_id = ${sessionId}
      RETURNING id;
    `;
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/analyses/[id] error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
