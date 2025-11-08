/* app/api/process/route.ts */

import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";

type BraveWebResult = {
  title?: string;
  url?: string;
  description?: string;
};


const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /\+?[0-9][0-9\s().-]{6,}/g;
const LOCATION_HINTS = [
  "new york", "san francisco", "london", "berlin", "paris", "istanbul", "ankara", "izmir",
  "toronto", "sydney", "singapore", "dubai", "tokyo", "seoul", "madrid", "rome", "amsterdam",
];

async function expandQueriesWithOpenAI(query: string): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Basit fallback varyasyonlar
    return [
      query,
      `${query} official site`,
      `${query} company profile`,
      `${query} linkedin`,
      `${query} pricing`,
      `${query} about us`,
    ];
  }

  try {
    const prompt = `Given the entity name: "${query}", propose 8 diverse, related search queries covering aliases, localizations, official site, social profiles, pricing, products/services, and industry context. Return as a JSON array of strings only.`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "[]";
    try {
      const arr = JSON.parse(content);
      if (Array.isArray(arr)) {
        const list = arr.map((s: any) => String(s)).slice(0, 10);
        return Array.from(new Set([query, ...list]));
      }
    } catch {
      // ignore, fall through
    }
  } catch (e) {
    console.warn("OpenAI expand failed", e);
  }
  return [
    query,
    `${query} website`,
    `${query} linkedin`,
    `${query} twitter`,
    `${query} pricing`,
  ];
}

async function braveSearch(q: string): Promise<BraveWebResult[]> {
  const token = process.env.BRAVE_API_KEY;
  if (!token) return [];
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", q);
  url.searchParams.set("source", "web");

  const res = await fetch(url.toString(), {
    headers: {
      "X-Subscription-Token": token,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn("Brave HTTP", res.status, q);
    return [];
  }
  const json = await res.json();
  const web: any[] = json?.web?.results ?? [];
  return web.slice(0, 10).map((r: any) => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }));
}

function extractInsights(results: BraveWebResult[]) {
  const aliases = new Set<string>();
  const socials: Record<string, string[]> = {};
  const domains = new Set<string>();
  const contactPages = new Set<string>();
  const pricingPages = new Set<string>();
  const emails = new Set<string>();
  const phones = new Set<string>();
  const locations = new Set<string>();
  const domainCounts: Record<string, number> = {};

  const addSocial = (k: string, v: string) => {
    socials[k] = socials[k] || [];
    if (!socials[k].includes(v)) socials[k].push(v);
  };

  for (const r of results) {
    if (!r.url) continue;
    try {
      const u = new URL(r.url);
      const domain = u.hostname.replace(/^www\./, "");
      domains.add(domain);
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      const host = u.hostname.toLowerCase();
      if (host.includes("linkedin.com")) addSocial("linkedin", r.url);
      if (host.includes("twitter.com") || host.includes("x.com")) addSocial("twitter", r.url);
      if (host.includes("instagram.com")) addSocial("instagram", r.url);
      if (host.includes("facebook.com")) addSocial("facebook", r.url);
      if (host.includes("youtube.com")) addSocial("youtube", r.url);

      const path = (u.pathname || "").toLowerCase();
      if (path.includes("contact") || path.includes("iletisim") || path.includes("about")) {
        contactPages.add(r.url);
      }
      if (path.includes("pricing") || path.includes("price") || path.includes("ucret") || path.includes("fiyat")) {
        pricingPages.add(r.url);
      }
      if (r.title) {
        const t = r.title;
        const m = t.match(/aka\s+([\w\-\s]+)/i) || t.match(/formerly\s+([\w\-\s]+)/i);
        if (m) aliases.add(m[1].trim());
      }

      const haystack = `${r.title || ""} ${r.description || ""}`;
      const emailMatches = haystack.match(EMAIL_REGEX);
      if (emailMatches) emailMatches.forEach((e) => emails.add(e.toLowerCase()));

      const phoneMatches = haystack.match(PHONE_REGEX);
      if (phoneMatches) {
        phoneMatches.forEach((p) => {
          const cleaned = p.trim();
          if (cleaned.length >= 7) phones.add(cleaned);
        });
      }

      const haystackLower = haystack.toLowerCase();
      for (const hint of LOCATION_HINTS) {
        if (haystackLower.includes(hint)) {
          locations.add(hint.replace(/\b\w/g, (c) => c.toUpperCase()));
        }
      }
    } catch {}
  }

  const primaryDomain = Array.from(domains)[0] || null;
  const domainHighlights = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count }));
  return {
    aliases: Array.from(aliases),
    socials,
    primaryDomain,
    contactPages: Array.from(contactPages),
    pricingPages: Array.from(pricingPages),
    emails: Array.from(emails),
    phones: Array.from(phones),
    locations: Array.from(locations),
    domainHighlights,
  };
}

function classifyEntity(query: string, results: BraveWebResult[], socials: Record<string, string[]>) {
  const q = (query || "").trim();
  const tokens = q.split(/\s+/);
  const qLower = q.toLowerCase();
  const companyHints = ["inc", "llc", "ltd", "company", "corp", "gmbh", "sa", "a.ş", "yazılım", "solutions", "consulting", "technology", "teknoloji"];
  const personLikely = tokens.length === 2 && tokens[0][0] && tokens[1][0];
  const hasCompanyHint = companyHints.some((h) => qLower.includes(h));

  // URL patterns
  const allUrls = results.map((r) => r.url || "");
  const hasLinkedInCompany = allUrls.some((u) => /linkedin\.com\/company\//i.test(u));
  const hasLinkedInPerson = allUrls.some((u) => /linkedin\.com\/in\//i.test(u));

  if (hasCompanyHint || hasLinkedInCompany) return { type: "company", confidence: 0.7 } as const;
  if (hasLinkedInPerson || personLikely) return { type: "person", confidence: 0.6 } as const;
  if (Object.keys(socials).length >= 3) return { type: "company", confidence: 0.55 } as const;
  return { type: "unknown", confidence: 0.4 } as const;
}

async function fetchWithTimeout(url: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function enrichInsightsWithDomain(insights: ReturnType<typeof extractInsights>) {
  if (!insights.primaryDomain) return insights;

  const baseDomain = insights.primaryDomain.replace(/^https?:\/\//, "");
  const emails = new Set(insights.emails);
  const phones = new Set(insights.phones);
  const locations = new Set(insights.locations);
  const contactPages = new Set(insights.contactPages);
  const pricingPages = new Set(insights.pricingPages);

  const snapshot = await fetchWithTimeout(`https://r.jina.ai/https://${baseDomain}`);
  if (snapshot) {
    const lower = snapshot.toLowerCase();
    const emailMatches = snapshot.match(EMAIL_REGEX);
    emailMatches?.forEach((m) => emails.add(m.toLowerCase()));
    const phoneMatches = snapshot.match(PHONE_REGEX);
    phoneMatches?.forEach((m) => phones.add(m.trim()));
    for (const hint of LOCATION_HINTS) {
      if (lower.includes(hint)) {
        locations.add(hint.replace(/\b\w/g, (c) => c.toUpperCase()));
      }
    }
  }

  const contactGuesses = ["contact", "contact-us", "support"];
  const pricingGuesses = ["pricing", "plans", "solutions/pricing"];
  contactGuesses.forEach((slug) => contactPages.add(`https://${baseDomain}/${slug}`));
  pricingGuesses.forEach((slug) => pricingPages.add(`https://${baseDomain}/${slug}`));

  return {
    ...insights,
    emails: Array.from(emails),
    phones: Array.from(phones),
    locations: Array.from(locations),
    contactPages: Array.from(contactPages),
    pricingPages: Array.from(pricingPages),
  };
}

function summarizeQuerySignals(results: BraveWebResult[]) {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const locations = new Set<string>();
  const contactPages = new Set<string>();
  const pricingPages = new Set<string>();
  const domains = new Set<string>();

  for (const r of results) {
    if (r.url) {
      try {
        const u = new URL(r.url);
        domains.add(u.hostname.replace(/^www\./, ""));
        const path = (u.pathname || "").toLowerCase();
        if (path.includes("contact") || path.includes("iletisim") || path.includes("about")) {
          contactPages.add(r.url);
        }
        if (path.includes("pricing") || path.includes("price") || path.includes("plans") || path.includes("fiyat")) {
          pricingPages.add(r.url);
        }
      } catch {}
    }
    const haystack = `${r.title || ""} ${r.description || ""}`;
    const emailMatches = haystack.match(EMAIL_REGEX);
    emailMatches?.forEach((m) => emails.add(m.toLowerCase()));
    const phoneMatches = haystack.match(PHONE_REGEX);
    phoneMatches?.forEach((m) => {
      const cleaned = m.trim();
      if (cleaned.length >= 7) phones.add(cleaned);
    });
    const lower = haystack.toLowerCase();
    for (const hint of LOCATION_HINTS) {
      if (lower.includes(hint)) {
        locations.add(hint.replace(/\b\w/g, (c) => c.toUpperCase()));
      }
    }
  }

  return {
    domains: Array.from(domains).slice(0, 5),
    signals: {
      emails: Array.from(emails).slice(0, 4),
      phones: Array.from(phones).slice(0, 4),
      locations: Array.from(locations).slice(0, 4),
      contactPages: Array.from(contactPages).slice(0, 3),
      pricingPages: Array.from(pricingPages).slice(0, 3),
    },
  };
}
function inferCompanyFields(insights: ReturnType<typeof extractInsights>, results: BraveWebResult[]) {
  const sectors: string[] = [];
  const services: string[] = [];
  const sectorKeywords = [
    "ai", "artificial intelligence", "machine learning", "software", "consulting", "fintech", "ecommerce", "marketing", "healthcare", "education",
  ];
  const serviceKeywords = [
    "consulting", "integration", "automation", "chatbot", "analytics", "training", "development", "design", "optimization", "support",
  ];
  const texts = results.map((r) => `${r.title || ""} ${r.description || ""}`.toLowerCase());
  const has = (kw: string) => texts.some((t) => t.includes(kw));
  for (const kw of sectorKeywords) if (has(kw)) sectors.push(kw);
  for (const kw of serviceKeywords) if (has(kw)) services.push(kw);
  const uniq = (arr: string[]) => Array.from(new Set(arr));
  const logoUrl = insights.primaryDomain ? `https://www.google.com/s2/favicons?domain=${insights.primaryDomain}&sz=64` : null;
  return {
    logoUrl,
    contactPages: insights.contactPages,
    pricingPages: insights.pricingPages,
    sectors: uniq(sectors).slice(0, 8),
    services: uniq(services).slice(0, 12),
  };
}

function inferPersonFields(results: BraveWebResult[]) {
  // Best-effort extraction from titles
  const titles: string[] = [];
  for (const r of results) {
    const t = r.title || "";
    const m = t.match(/-\s*([^|\-•·]+)$/); // capture trailing role after dash
    if (m && m[1]) titles.push(m[1].trim());
  }
  const uniq = (arr: string[]) => Array.from(new Set(arr));
  return { titles: uniq(titles).slice(0, 10) };
}

// "handler" fonksiyonunu doğrudan "POST" olarak ihraç ediyoruz
export async function POST(request: NextRequest) {
  // Prod'da QStash imza doğrulaması (lokalde atlanır)
  let bodyJson: any;
  if (process.env.NODE_ENV === "production") {
    try {
      const raw = await request.text();
      const signature = request.headers.get("Upstash-Signature") || "";
      const receiver = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
      });
      const isValid = await receiver.verify({ signature, body: raw });
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      bodyJson = JSON.parse(raw || "{}");
    } catch (e) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }
  } else {
    // Development: normal JSON parse
    bodyJson = await request.json().catch(() => ({}));
  }

  const { analysisId, query } = bodyJson || {};

  if (!analysisId || !query) {
    return NextResponse.json({ error: "Missing analysisId or query" }, { status: 400 });
  }

  try {
    await sql`
      UPDATE analyses
      SET status = 'running', updated_at = NOW()
      WHERE id = ${analysisId};
    `;

    console.log(`PROCESS START: ${query} (ID: ${analysisId})`);

    const expanded = await expandQueriesWithOpenAI(query);
    const allResults: Record<string, BraveWebResult[]> = {};
    for (const q of expanded) {
      // eslint-disable-next-line no-await-in-loop
      allResults[q] = await braveSearch(q);
    }

    const flat = Object.values(allResults).flat();
    const rawInsights = extractInsights(flat);
    const insights = await enrichInsightsWithDomain(rawInsights);
    const classification = classifyEntity(query, flat, insights.socials);
    const company = classification.type === "company" ? inferCompanyFields(insights, flat) : undefined;
    const person = classification.type === "person" ? inferPersonFields(flat) : undefined;
    const trace = Object.entries(allResults).map(([searchQuery, queryResults]) => {
      const summary = summarizeQuerySignals(queryResults);
      return {
        query: searchQuery,
        domains: summary.domains,
        topResults: queryResults.slice(0, 3),
        signals: summary.signals,
      };
    });

    const resultPayload = {
      query,
      expandedQueries: expanded,
      insights,
      classification,
      company,
      person,
      samples: flat.slice(0, 25),
      trace,
      meta: {
        braveEnabled: Boolean(process.env.BRAVE_API_KEY),
        openaiEnabled: Boolean(process.env.OPENAI_API_KEY),
        finishedAt: new Date().toISOString(),
      },
    };

    console.log(`PROCESS DONE: ${query} (ID: ${analysisId})`);

    await sql`
      UPDATE analyses
      SET status = 'completed',
          result = ${JSON.stringify(resultPayload)}::jsonb,
          updated_at = NOW()
      WHERE id = ${analysisId};
    `;

    return NextResponse.json({ success: true, analysisId }, { status: 200 });
  } catch (error) {
    console.error("Processor error:", error);
    await sql`
      UPDATE analyses
      SET status = 'failed', updated_at = NOW()
      WHERE id = ${analysisId};
    `;
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
