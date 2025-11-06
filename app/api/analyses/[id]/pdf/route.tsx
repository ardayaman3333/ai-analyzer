import React from "react";
import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

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
  listItem: {
    fontSize: 11,
    marginBottom: 2,
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
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 10,
  },
});

type AnalysisRow = {
  id: string;
  query: string;
  status: string;
  result: any | null;
  created_at: string | null;
  updated_at: string | null;
};

const toArray = (value: any): string[] =>
  Array.isArray(value) ? value.map((v) => String(v)) : [];

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

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString() : "-";

  const bulletList = (items?: string[], empty = "-") => {
    if (!items || items.length === 0) {
      return <Text style={styles.text}>{empty}</Text>;
    }
    return (
      <View>
        {items.map((item, index) => (
          <Text key={index} style={styles.listItem}>
            • {item}
          </Text>
        ))}
      </View>
    );
  };

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
            Classification: {classification?.type ?? "unknown"} (
            {classification?.confidence
              ? `${Math.round((classification.confidence as number) * 100)}% confidence`
              : "confidence unavailable"}
            )
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <Text style={styles.text}>
            Primary Domain: {insights?.primaryDomain ?? "-"}
          </Text>
          <Text style={styles.text}>Aliases:</Text>
          {bulletList(aliases)}
          <Text style={[styles.text, { marginTop: 6 }]}>Emails:</Text>
          {bulletList(emails)}
          <Text style={[styles.text, { marginTop: 6 }]}>Phones:</Text>
          {bulletList(phones)}
          <Text style={[styles.text, { marginTop: 6 }]}>Locations:</Text>
          {bulletList(locations)}
          <Text style={[styles.text, { marginTop: 6 }]}>Contact Pages:</Text>
          {bulletList(contactPages)}
          <Text style={[styles.text, { marginTop: 6 }]}>Pricing Pages:</Text>
          {bulletList(pricingPages)}
          {domainHighlights.length ? (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.text}>Top Domains:</Text>
              <View style={styles.chipRow}>
                {domainHighlights.map((item: any, index: number) => (
                  <Text key={index} style={styles.chip}>
                    {item.domain} ({item.count})
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {Object.keys(socials).length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Profiles</Text>
            {Object.entries(socials).map(([platform, urls]) => (
              <View key={platform} style={{ marginBottom: 6 }}>
                <Text style={[styles.text, { fontWeight: 600 }]}>{platform}</Text>
                {bulletList(toArray(urls), "-")}
              </View>
            ))}
          </View>
        ) : null}

        {classification?.type === "company" && company ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Profile</Text>
            <Text style={styles.text}>Sectors:</Text>
            {bulletList(toArray(company.sectors))}
            <Text style={[styles.text, { marginTop: 6 }]}>Services:</Text>
            {bulletList(toArray(company.services))}
          </View>
        ) : null}

        {classification?.type === "person" && person ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Person Profile</Text>
            <Text style={styles.text}>Possible Titles:</Text>
            {bulletList(toArray(person.titles))}
          </View>
        ) : null}

        {report ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={[styles.text, { marginBottom: 8 }]}>
              {report.overview || "Summary unavailable."}
            </Text>
            <Text style={styles.text}>Strengths:</Text>
            {bulletList(toArray(report.strengths))}
            <Text style={[styles.text, { marginTop: 6 }]}>Weaknesses:</Text>
            {bulletList(toArray(report.weaknesses))}
            <Text style={[styles.text, { marginTop: 6 }]}>Opportunities:</Text>
            {bulletList(toArray(report.opportunities))}
            <Text style={[styles.text, { marginTop: 6 }]}>Threats:</Text>
            {bulletList(toArray(report.threats))}
            <Text style={[styles.text, { marginTop: 8 }]}>
              Digital Score: {report.digitalScore ?? "-"} / 100
            </Text>
            <Text style={styles.text}>
              Authority Score: {report.authorityScore ?? "-"} / 100
            </Text>
            <Text style={[styles.text, { marginTop: 6 }]}>Recommended AI Products:</Text>
            {bulletList(toArray(report.recommendedAIProducts))}
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
  req: NextRequest,
  ctx: { params?: { id?: string } }
) {
  let id = ctx?.params?.id;
  if (!id) {
    try {
      const url = new URL(req.url);
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
    const result = (row.result as any) || {};
    const reportData = {
      id: row.id,
      query: row.query,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      insights: result.insights || {},
      classification: result.classification || {},
      company: result.company,
      person: result.person,
      report: result.report,
    };

    const buffer = await pdf(
      <AnalysisReportDocument data={reportData} />
    ).toBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="analysis-${row.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/analyses/[id]/pdf error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

