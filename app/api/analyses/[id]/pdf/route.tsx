import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

type AnalysisRow = {
  id: string;
  query: string;
  status: string;
  result: any | null;
  created_at: string | null;
  updated_at: string | null;
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1f2933",
  },
  header: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  subheader: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  chipRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#cbd5f5",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
  },
});

const bullet = "•";

const toArray = (value: any): string[] =>
  Array.isArray(value) ? value.map((v) => String(v)) : [];

function BulletList({ items, empty = "-" }: { items?: string[]; empty?: string }) {
  if (!items || items.length === 0) {
    return <Text style={styles.text}>{empty}</Text>;
  }
  return (
    <View>
      {items.map((item, index) => (
        <Text key={index} style={styles.text}>
          {`${bullet} ${item}`}
        </Text>
      ))}
    </View>
  );
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

function AnalysisReportDocument({
  data,
}: {
  data: {
    id: string;
    query: string;
    status: string;
    createdAt?: string | null;
    updatedAt?: string | null;
    insights: any;
    classification: any;
    company?: any;
    person?: any;
    report?: any;
  };
}) {
  const {
    id,
    query,
    status,
    createdAt,
    updatedAt,
    insights,
    classification,
    company,
    person,
    report,
  } = data;

  const aliases = toArray(insights?.aliases);
  const emails = toArray(insights?.emails);
  const phones = toArray(insights?.phones);
  const locations = toArray(insights?.locations);
  const contactPages = toArray(insights?.contactPages);
  const pricingPages = toArray(insights?.pricingPages);
  const socials = insights?.socials || {};
  const domainHighlights = Array.isArray(insights?.domainHighlights)
    ? insights.domainHighlights
    : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>NexusAI Analyzer Report</Text>
        <Text style={styles.subheader}>Analysis ID: {id}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.text}>Query: {query}</Text>
          <Text style={styles.text}>Status: {status}</Text>
          <Text style={styles.text}>Created: {formatDate(createdAt)}</Text>
          <Text style={styles.text}>Last Updated: {formatDate(updatedAt)}</Text>
          <Text style={styles.text}>
            Classification: {classification?.type ?? "unknown"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <Text style={styles.text}>
            Primary Domain: {insights?.primaryDomain ?? "-"}
          </Text>
          <Text style={styles.text}>Aliases:</Text>
          <BulletList items={aliases} />
          <Text style={styles.text}>Emails:</Text>
          <BulletList items={emails} />
          <Text style={styles.text}>Phones:</Text>
          <BulletList items={phones} />
          <Text style={styles.text}>Locations:</Text>
          <BulletList items={locations} />
          <Text style={styles.text}>Contact Pages:</Text>
          <BulletList items={contactPages} />
          <Text style={styles.text}>Pricing Pages:</Text>
          <BulletList items={pricingPages} />
          {domainHighlights.length ? (
            <View style={styles.chipRow}>
              {domainHighlights.map((item: any, index: number) => (
                <Text key={index} style={styles.chip}>
                  {item.domain} ({item.count})
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        {Object.keys(socials).length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Profiles</Text>
            {Object.entries(socials).map(([platform, urls]) => (
              <View key={platform}>
                <Text style={styles.text}>{platform}</Text>
                <BulletList items={toArray(urls)} />
              </View>
            ))}
          </View>
        ) : null}

        {classification?.type === "company" && company ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Profile</Text>
            <Text style={styles.text}>Sectors:</Text>
            <BulletList items={toArray(company.sectors)} />
            <Text style={styles.text}>Services:</Text>
            <BulletList items={toArray(company.services)} />
          </View>
        ) : null}

        {classification?.type === "person" && person ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Person Profile</Text>
            <Text style={styles.text}>Possible Titles:</Text>
            <BulletList items={toArray(person.titles)} />
          </View>
        ) : null}

        {report ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={styles.text}>{report.overview || "Summary unavailable."}</Text>
            <Text style={styles.text}>Strengths:</Text>
            <BulletList items={toArray(report.strengths)} />
            <Text style={styles.text}>Weaknesses:</Text>
            <BulletList items={toArray(report.weaknesses)} />
            <Text style={styles.text}>Opportunities:</Text>
            <BulletList items={toArray(report.opportunities)} />
            <Text style={styles.text}>Threats:</Text>
            <BulletList items={toArray(report.threats)} />
            <Text style={styles.text}>Digital Score: {report.digitalScore ?? "-"}/100</Text>
            <Text style={styles.text}>Authority Score: {report.authorityScore ?? "-"}/100</Text>
            <Text style={styles.text}>Recommended AI Products:</Text>
            <BulletList items={toArray(report.recommendedAIProducts)} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={styles.text}>
              Report not generated yet. Visit the analysis detail page to create the executive summary.
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  let id: string | undefined = resolved?.id;

  if (!id) {
    try {
      const url = new URL(request.url);
      const parts = url.pathname.split("/").filter(Boolean);
      id = parts[parts.length - 2] || parts[parts.length - 1];
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
    const parsedResult = typeof row.result === "string" ? JSON.parse(row.result) : row.result ?? {};

    const rawBuffer = await pdf(
      <AnalysisReportDocument
        data={{
          id: row.id,
          query: row.query,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          insights: parsedResult.insights || {},
          classification: parsedResult.classification || {},
          company: parsedResult.company,
          person: parsedResult.person,
          report: parsedResult.report,
        }}
      />
    ).toBuffer();

    const buffer = rawBuffer as unknown as Uint8Array;
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const response = new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="analysis-${row.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });

    return NextResponse.fromResponse(response);
  } catch (error) {
    console.error("GET /api/analyses/[id]/pdf error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
