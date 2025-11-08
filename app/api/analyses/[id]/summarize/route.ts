import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";

type Report = {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  digitalScore: number; // 0-100
  authorityScore: number; // 0-100
  recommendedAIProducts: string[];
};

function buildPrompt(input: any) {
  const {
    query,
    insights,
    expandedQueries,
    samples,
    classification,
    company,
    person,
  } = input || {};
  return `You are an experienced brand analyst. Produce a concise, data-backed report in JSON with keys:
  overview (string, 4-6 sentences summarizing who they are, positioning, notable findings),
  strengths (string[]), weaknesses (string[]), opportunities (string[]), threats (string[]),
  digitalScore (0-100), authorityScore (0-100), recommendedAIProducts (string[]) tailored to pain points.
  Entity name: ${query}.
  Classification: ${JSON.stringify(classification ?? {})}.
  Company profile (if any): ${JSON.stringify(company ?? {})}.
  Person profile (if any): ${JSON.stringify(person ?? {})}.
  Core insights: ${JSON.stringify(insights ?? {})}.
  Expanded queries: ${JSON.stringify(expandedQueries ?? [])}.
  Top web results (title/url/description): ${JSON.stringify((samples ?? []).slice(0, 12))}.
  Use only the provided data. Scores must be numbers 0-100. Return ONLY the JSON object.`;
}

function fallbackReport(resultPayload: any): Report {
  const type = resultPayload?.classification?.type ?? "entity";
  const sectors = resultPayload?.company?.sectors ?? [];
  const services = resultPayload?.company?.services ?? [];
  const titles = resultPayload?.person?.titles ?? [];
  const emails = resultPayload?.insights?.emails ?? [];
  const phones = resultPayload?.insights?.phones ?? [];
  const locations = resultPayload?.insights?.locations ?? [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  if (resultPayload?.insights?.primaryDomain) {
    strengths.push(`Identified domain presence at ${resultPayload.insights.primaryDomain}.`);
  }
  if (Object.keys(resultPayload?.insights?.socials || {}).length) {
    strengths.push("Active or discoverable social media footprint.");
  }
  if (sectors.length) {
    strengths.push(`Signals of sector focus: ${sectors.slice(0, 3).join(", ")}.`);
  }
  if (services.length) {
    strengths.push(`Indications of key offerings: ${services.slice(0, 3).join(", ")}.`);
  }
  if (titles.length) {
    strengths.push(`Professional titles detected: ${titles.slice(0, 3).join(", ")}.`);
  }
  if (emails.length) {
    strengths.push("Reachable email touchpoints surfaced in public sources.");
  }
  if (phones.length) {
    strengths.push("Public phone contact details discovered.");
  }
  if (locations.length) {
    strengths.push(`Geographic signals include: ${locations.slice(0, 3).join(", ")}.`);
  }

  if (!resultPayload?.insights?.primaryDomain) {
    weaknesses.push("No clear primary domain identified.");
  }
  if (!Object.keys(resultPayload?.insights?.socials || {}).length) {
    weaknesses.push("Limited social media signals observed.");
  }
  if (!sectors.length && type === "company") {
    weaknesses.push("Sector positioning not explicit in first-pass crawl.");
  }
  if (!titles.length && type === "person") {
    weaknesses.push("Professional role not clearly stated in top results.");
  }
  if (!emails.length) {
    weaknesses.push("Verified email contact not found in top-level sources.");
  }
  if (!phones.length) {
    weaknesses.push("Phone contact information absent across initial crawl.");
  }

  opportunities.push("Strengthen owned content to clarify value proposition and authority.");
  if (type === "company" && !(resultPayload?.company?.pricingPages || []).length) {
    opportunities.push("Publish transparent pricing or case studies to build trust.");
  }
  if (type === "person" && !Object.keys(resultPayload?.insights?.socials || {}).includes("linkedin")) {
    opportunities.push("Optimize LinkedIn presence to increase discoverability.");
  }
  if (!locations.length) {
    opportunities.push("Highlight geographic focus or service regions on owned channels.");
  }

  threats.push("Competitive players targeting similar keywords and audiences.");
  threats.push("Potential reputation risks from unmonitored web mentions.");

  const digitalScore = strengths.length ? 60 + Math.min(strengths.length * 5, 20) : 45;
  const authorityScore = 50 + (resultPayload?.insights?.primaryDomain ? 10 : 0) + (Object.keys(resultPayload?.insights?.socials || {}).length ? 10 : 0);

  const recommendedAIProducts = type === "company"
    ? [
        "AI sales enablement automations",
        "Customer-facing chatbot for lead capture",
        "AI-powered competitor monitoring dashboard",
      ]
    : [
        "Personal brand content assistant",
        "AI networking outreach automations",
        "Thought leadership summarizer",
      ];

  return {
    overview: `Preliminary ${type} analysis for ${resultPayload?.query || "the entity"}, derived from high-level web signals.`,
    strengths,
    weaknesses,
    opportunities,
    threats,
    digitalScore: Math.min(95, Math.max(30, digitalScore)),
    authorityScore: Math.min(90, Math.max(25, authorityScore)),
    recommendedAIProducts,
  };
}

function extractReasoningText(data: any) {
  if (!data) return "";
  if (Array.isArray(data.output)) {
    return data.output
      .flatMap((item: any) =>
        Array.isArray(item.content)
          ? item.content
              .filter((c: any) => c.type === "output_text" || c.type === "text")
              .map((c: any) => c.text || "")
          : []
      )
      .join("\n")
      .trim();
  }
  if (Array.isArray(data.content)) {
    return data.content
      .filter((c: any) => c.type === "output_text" || c.type === "text")
      .map((c: any) => c.text || "")
      .join("\n")
      .trim();
  }
  return "";
}

async function generateReport(resultPayload: any): Promise<Report> {
  const apiKey = process.env.OPENAI_API_KEY;
  const reasoningModel = process.env.OPENAI_REASONING_MODEL;
  if (!apiKey) {
    return fallbackReport(resultPayload);
  }
  try {
    if (reasoningModel) {
      const prompt = buildPrompt(resultPayload);
      try {
        const res = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: reasoningModel,
            reasoning: { effort: "medium" },
            max_output_tokens: 1800,
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: `You are an experienced brand analyst that must output valid JSON only. ${prompt}`,
                  },
                ],
              },
            ],
          }),
        });
        if (!res.ok) throw new Error(`OpenAI Reasoning HTTP ${res.status}`);
        const data = await res.json();
        const extracted = extractReasoningText(data);
        if (extracted) {
          return JSON.parse(extracted) as Report;
        }
      } catch (reasoningErr) {
        console.warn("Reasoning API failed, falling back to chat completions", reasoningErr);
      }
    }

    const prompt = buildPrompt(resultPayload);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful analyst that responds in JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start >= 0 && end > start) {
        parsed = JSON.parse(content.slice(start, end + 1));
      } else {
        throw new Error("Invalid JSON from model");
      }
    }
    return parsed as Report;
  } catch (e) {
    console.warn("OpenAI summarize failed, using fallback", e);
    return fallbackReport(resultPayload);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  let id: string | undefined = resolved?.id;

  if (!id) {
    try {
      const url = new URL(req.url);
      const parts = url.pathname.split("/").filter(Boolean);
      id = parts[parts.length - 2] || parts[parts.length - 1];
    } catch {}
  }
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("nexus_session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session" }, { status: 401 });
  }

  try {
    const { rows } = await sql`
      SELECT id, query, status, result, session_id
      FROM analyses
      WHERE id::text = ${id}
      LIMIT 1;
    `;
    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = rows[0] as any;
    if (row.session_id !== sessionId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const result = row.result || {};

    // If already present and not forced, return cached
    const { searchParams } = new URL(req.url);
    const force = (searchParams.get("force") || "").toLowerCase() === "true";
    if (result?.report && !force) {
      return NextResponse.json(result.report, { status: 200 });
    }

    const report = await generateReport({
      query: row.query,
      ...(result || {}),
    });

    const newResult = { ...(result || {}), report };
    await sql`
      UPDATE analyses
      SET result = ${JSON.stringify(newResult)}::jsonb, updated_at = NOW()
      WHERE id = ${row.id};
    `;

    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    console.error("POST /api/analyses/[id]/summarize error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
