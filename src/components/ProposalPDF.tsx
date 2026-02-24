import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  Svg,
  Path,
} from '@react-pdf/renderer';
import { Proposal, Agent, Template, TermOption } from '@/lib/types';
import { calculatePricing, getTermDisplayName, getTermMonths } from '@/lib/pricing';
import { getServiceScope, EXECUTIVE_SUMMARY_CONTENT, SERVICE_DESCRIPTIONS } from '@/lib/content';
import { format } from 'date-fns';

// ── Fonts ──
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf', fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback(word => [word]);

// ── Brand Colors (from gomega.ai) ──
const BRAND_BLUE = '#2563eb';
const BRAND_BLUE_LIGHT = '#eff6ff';
const BRAND_BLUE_MEDIUM = '#dbeafe';
const BRAND_BLUE_DARK = '#1e40af';
const G50 = '#f9fafb';
const G100 = '#f3f4f6';
const G200 = '#e5e7eb';
const G300 = '#d1d5db';
const G400 = '#9ca3af';
const G500 = '#6b7280';
const G600 = '#4b5563';
const G700 = '#374151';
const G800 = '#1f2937';
const G900 = '#111827';
const GREEN_50 = '#f0fdf4';
const GREEN_600 = '#16a34a';
const GREEN_800 = '#166534';

const s = StyleSheet.create({
  page: { fontFamily: 'Inter', fontSize: 9, color: G800, paddingTop: 44, paddingBottom: 52, paddingHorizontal: 44, backgroundColor: '#ffffff' },

  // Footer
  footerLine: { position: 'absolute', bottom: 38, left: 44, right: 44, borderBottomWidth: 0.5, borderBottomColor: G200 },
  footerBrand: { position: 'absolute', bottom: 22, left: 44, fontSize: 7.5, color: G400 },
  pageNum: { position: 'absolute', bottom: 22, right: 44, fontSize: 7.5, color: G400 },

  // Cover header — light background matching gomega.ai
  coverTopBar: { backgroundColor: BRAND_BLUE, height: 4, marginHorizontal: -44, marginTop: -44, marginBottom: 0 },
  coverHeader: { backgroundColor: BRAND_BLUE_LIGHT, marginHorizontal: -44, paddingHorizontal: 44, paddingTop: 24, paddingBottom: 24, marginBottom: 24 },
  logoSvg: { width: 100, height: 36, marginBottom: 14 },
  coverTitle: { fontSize: 24, fontWeight: 700, color: G900, marginBottom: 6 },
  coverAgents: { fontSize: 11, fontWeight: 500, color: BRAND_BLUE },

  // Meta
  metaRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: G200 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 7, fontWeight: 600, color: BRAND_BLUE, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 2, marginTop: 8 },
  metaValue: { fontSize: 10, fontWeight: 500, color: G900 },
  metaValueSub: { fontSize: 9, color: G600 },

  // Section headings
  secTitle: { fontSize: 15, fontWeight: 700, color: G900, marginBottom: 8 },
  secBar: { borderBottomWidth: 2.5, borderBottomColor: BRAND_BLUE, marginBottom: 12, width: 32 },
  subTitle: { fontSize: 11, fontWeight: 600, color: G900, marginBottom: 8 },
  label: { fontSize: 7, fontWeight: 600, color: BRAND_BLUE, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },

  // Body
  body: { fontSize: 9, lineHeight: 1.6, color: G700 },

  // Service overview cards (matching gomega.ai card style)
  svcRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 14 },
  svcCard: { flex: 1, borderWidth: 1, borderColor: G200, borderRadius: 8, padding: 14, backgroundColor: '#ffffff' },
  svcIconWrap: { width: 28, height: 28, borderRadius: 6, backgroundColor: BRAND_BLUE_LIGHT, marginBottom: 8, alignItems: 'center' as const, justifyContent: 'center' as const },
  svcIcon: { fontSize: 8, fontWeight: 700, color: BRAND_BLUE },
  svcTitle: { fontSize: 10, fontWeight: 600, color: G900, marginBottom: 4 },
  svcDesc: { fontSize: 7.5, color: G600, lineHeight: 1.5 },

  // Highlights
  hlBox: { backgroundColor: BRAND_BLUE_LIGHT, borderRadius: 6, borderWidth: 1, borderColor: BRAND_BLUE_MEDIUM, padding: 12, marginBottom: 10 },
  hlRow: { flexDirection: 'row' as const, marginBottom: 5 },
  hlIcon: { width: 12, height: 12, borderRadius: 6, backgroundColor: BRAND_BLUE, marginRight: 7, marginTop: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  hlCheck: { color: '#ffffff', fontSize: 6.5, fontWeight: 700 },
  hlText: { flex: 1, fontSize: 8, color: G800, lineHeight: 1.5 },

  // Deliverable cards
  catRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 8 },
  catCard: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: G200, borderRadius: 6, padding: 10 },
  catTitle: { fontSize: 8.5, fontWeight: 600, color: G900, marginBottom: 5 },
  bullet: { flexDirection: 'row' as const, marginBottom: 2.5 },
  dot: { color: BRAND_BLUE, fontSize: 7, marginRight: 4, marginTop: 0.5 },
  bText: { flex: 1, fontSize: 7, color: G700, lineHeight: 1.4 },

  // Timeline
  tlRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 8 },
  tlCard: { flex: 1, borderWidth: 1, borderColor: BRAND_BLUE_MEDIUM, borderRadius: 6, padding: 10, backgroundColor: BRAND_BLUE_LIGHT },
  tlPhase: { fontSize: 8.5, fontWeight: 600, color: BRAND_BLUE, marginBottom: 5 },

  // Pricing
  priceRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 14, alignItems: 'stretch' as const },
  priceCard: { flex: 1, borderWidth: 1.5, borderColor: G200, borderRadius: 8, padding: 14, backgroundColor: '#ffffff' },
  priceCardBest: { flex: 1, borderWidth: 2, borderColor: BRAND_BLUE, borderRadius: 8, padding: 14, backgroundColor: BRAND_BLUE_LIGHT },
  bestBadge: { backgroundColor: BRAND_BLUE, color: '#ffffff', fontSize: 6.5, fontWeight: 700, paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 8, alignSelf: 'center' as const, marginBottom: 6, letterSpacing: 0.4, textTransform: 'uppercase' as const },
  pTermName: { fontSize: 12, fontWeight: 700, color: G900, textAlign: 'center' as const, marginBottom: 2 },
  pTermMonths: { fontSize: 7.5, color: G500, textAlign: 'center' as const, marginBottom: 10 },
  pAgentRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 4 },
  pAgentName: { fontSize: 8, color: G700, maxWidth: '55%' as any },
  pPriceWrap: { flexDirection: 'column' as const, alignItems: 'flex-end' as const },
  pStrike: { fontSize: 6.5, color: G400, textDecoration: 'line-through' as const, marginBottom: 1 },
  pPrice: { fontSize: 8.5, fontWeight: 600, color: G900 },
  pDivider: { borderBottomWidth: 0.75, borderBottomColor: G200, marginVertical: 8 },
  pMonthRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 3 },
  pMonthLabel: { fontSize: 8.5, fontWeight: 500, color: G700 },
  pMonthVal: { fontSize: 10, fontWeight: 700, color: G900 },
  pUpBox: { backgroundColor: BRAND_BLUE_LIGHT, borderRadius: 6, padding: 10, marginTop: 8, alignItems: 'center' as const },
  pUpLabel: { fontSize: 7.5, color: G500, marginBottom: 3 },
  pUpVal: { fontSize: 18, fontWeight: 700, color: BRAND_BLUE },
  pDisc: { fontSize: 7.5, color: GREEN_600, fontWeight: 500, marginTop: 3 },

  savingsBar: { backgroundColor: GREEN_50, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 6, padding: 8, alignItems: 'center' as const, marginBottom: 16 },
  savingsText: { fontSize: 8.5, fontWeight: 500, color: GREEN_800 },
  savingsBold: { fontWeight: 700 },

  nextBox: { borderWidth: 1.5, borderColor: BRAND_BLUE, borderRadius: 8, padding: 16, backgroundColor: BRAND_BLUE_LIGHT },
  nextTitle: { fontSize: 11, fontWeight: 600, color: G900, marginBottom: 6 },
  nextText: { fontSize: 8.5, color: G700, lineHeight: 1.6, marginBottom: 4 },
  nextCta: { fontSize: 9, fontWeight: 600, color: BRAND_BLUE, marginTop: 4 },

  agentSep: { borderBottomWidth: 1, borderBottomColor: G200, marginTop: 14, marginBottom: 14 },

  // Why Mega cards
  whyRow: { flexDirection: 'row' as const, gap: 10, marginTop: 4 },
  whyCard: { flex: 1, borderWidth: 1, borderColor: G200, borderRadius: 8, padding: 12, backgroundColor: '#ffffff' },
  whyTitle: { fontSize: 9, fontWeight: 600, color: BRAND_BLUE, marginBottom: 4 },
  whyDesc: { fontSize: 7.5, color: G700, lineHeight: 1.5 },
});

// Agent icon labels (react-pdf doesn't support emoji)
const AGENT_ICON_LABELS: Record<string, string> = {
  seo: 'SEO',
  paid_ads: 'ADS',
  website: 'WEB',
};

function pairUp<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
}

function Footer() {
  return (
    <>
      <View style={s.footerLine} fixed />
      <Text style={s.footerBrand} fixed>Mega  •  gomega.ai</Text>
      <Text style={s.pageNum} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={s.bullet}>
      <Text style={s.dot}>•</Text>
      <Text style={s.bText}>{text}</Text>
    </View>
  );
}

function ServiceScope({ agent, template, isLast }: { agent: Agent; template: Template; isLast: boolean }) {
  const c = getServiceScope(agent, template);
  const catPairs = pairUp(c.categories || []);
  const tlPairs = c.timeline ? pairUp(c.timeline) : [];
  const shortName = c.title.replace(' Services Scope', '');

  return (
    <>
      {/* Section header + description + highlights grouped */}
      <View wrap={false}>
        <Text style={s.secTitle}>{c.title}</Text>
        <View style={s.secBar} />
        <Text style={[s.body, { marginBottom: 10 }]}>{c.description}</Text>
        <View style={s.hlBox}>
          {c.highlights.map((h, i) => (
            <View key={i} style={[s.hlRow, i === c.highlights.length - 1 ? { marginBottom: 0 } : {}]}>
              <View style={s.hlIcon}><Text style={s.hlCheck}>✓</Text></View>
              <Text style={s.hlText}>{h}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Deliverables — label grouped with first row */}
      {catPairs.map((pair, i) => (
        <View key={`cat-${i}`} wrap={false}>
          {i === 0 && <Text style={s.label}>{shortName} — Service Deliverables</Text>}
          <View style={s.catRow}>
            {pair.map((cat, j) => (
              <View key={j} style={s.catCard}>
                <Text style={s.catTitle}>{cat.name}</Text>
                {cat.items.map((item, k) => <Bullet key={k} text={item} />)}
              </View>
            ))}
            {pair.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        </View>
      ))}

      {/* Timeline — heading grouped with first row */}
      {c.timeline && c.timeline.length > 0 && (
        <>
          {tlPairs.map((pair, i) => (
            <View key={`tl-${i}`} wrap={false}>
              {i === 0 && <Text style={[s.subTitle, { marginTop: 12 }]}>Implementation Timeline</Text>}
              <View style={s.tlRow}>
                {pair.map((phase, j) => (
                  <View key={j} style={s.tlCard}>
                    <Text style={s.tlPhase}>{phase.phase}</Text>
                    {phase.items.map((item, k) => <Bullet key={k} text={item} />)}
                  </View>
                ))}
                {pair.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            </View>
          ))}
        </>
      )}

      {!isLast && <View style={s.agentSep} />}
    </>
  );
}

export function ProposalPDF({ proposal }: { proposal: Proposal }) {
  const terms: TermOption[] =
    proposal.selectedTerms && proposal.selectedTerms.length > 0
      ? proposal.selectedTerms
      : [{ term: proposal.contractTerm, discountPercentage: proposal.discountPercentage || 0 }];

  const termPricings = terms.map(opt => ({
    option: opt,
    pricing: calculatePricing(proposal.selectedAgents, opt.term, opt.discountPercentage),
  }));
  const isSingleTerm = termPricings.length === 1;

  return (
    <Document>
      {/* ===== COVER PAGE ===== */}
      <Page size="LETTER" style={s.page}>
        <Footer />

        {/* Blue accent bar at top */}
        <View style={s.coverTopBar} />

        {/* Light header with logo */}
        <View style={s.coverHeader}>
          {/* Mega wordmark SVG — vector, crisp at any size */}
          <Svg viewBox="0 -0.5 56 20.5" style={s.logoSvg}>
            <Path d="M 52.483 5.276 L 52.483 3.883 L 56 3.883 L 56 15.303 L 52.483 15.303 L 52.483 13.909 L 52.391 13.909 C 51.706 14.892 50.45 15.645 48.874 15.645 C 45.882 15.645 43.598 13.247 43.598 9.638 C 43.598 6.121 45.745 3.54 48.874 3.54 C 50.45 3.54 51.706 4.294 52.391 5.276 Z M 49.833 12.311 C 51.409 12.311 52.483 11.077 52.483 9.593 C 52.483 8.04 51.364 6.875 49.833 6.875 C 48.326 6.875 47.184 7.994 47.184 9.593 C 47.184 11.191 48.326 12.311 49.833 12.311 Z M 39.613 5.276 L 39.613 3.883 L 43.131 3.883 L 43.131 16.513 C 43.131 18.683 41.852 19.871 39.659 19.871 L 32.236 19.871 L 32.236 16.308 L 38.791 16.308 C 39.271 16.308 39.613 16.034 39.613 15.577 L 39.613 13.909 L 39.522 13.909 C 38.837 14.892 37.58 15.645 36.005 15.645 C 33.013 15.645 30.729 13.247 30.729 9.638 C 30.729 6.121 32.876 3.54 36.005 3.54 C 37.58 3.54 38.837 4.294 39.522 5.276 Z M 36.964 12.311 C 38.54 12.311 39.613 11.077 39.613 9.593 C 39.613 8.04 38.494 6.875 36.964 6.875 C 35.456 6.875 34.314 7.994 34.314 9.593 C 34.314 11.191 35.456 12.311 36.964 12.311 Z M 24.352 3.54 C 28.166 3.54 30.61 6.601 30.153 10.758 L 21.931 10.758 C 22.159 11.625 22.913 12.402 24.238 12.516 C 25.106 12.585 26.042 12.219 26.408 11.648 L 30.085 11.648 C 29.354 14.252 27.001 15.645 24.284 15.645 C 20.378 15.645 18.368 12.79 18.368 9.593 C 18.368 6.167 20.835 3.54 24.352 3.54 Z M 24.329 6.646 C 23.187 6.646 22.296 7.217 21.977 8.131 L 26.659 8.131 C 26.339 7.172 25.448 6.646 24.329 6.646 Z M 17.609 0 L 17.609 15.303 L 13.841 15.303 L 13.841 5.573 L 9.89 15.303 L 7.72 15.303 L 3.769 5.573 L 3.769 15.303 L 0 15.303 L 0 0 L 5.23 0 L 8.816 9.09 L 12.425 0 Z" fill="#2563EB" />
          </Svg>
          <Text style={s.coverTitle}>Proposal for {proposal.companyName}</Text>
          <Text style={s.coverAgents}>
            {proposal.selectedAgents.map(a => SERVICE_DESCRIPTIONS[a].title).join('  |  ')}
          </Text>
        </View>

        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>Prepared For</Text>
            <Text style={s.metaValue}>{proposal.customerName}</Text>
            <Text style={s.metaValueSub}>{proposal.companyName}</Text>
          </View>
          <View style={[s.metaCol, { alignItems: 'flex-end' as const }]}>
            <Text style={s.metaLabel}>Date</Text>
            <Text style={s.metaValue}>{format(new Date(proposal.createdAt), 'MMMM dd, yyyy')}</Text>
            <Text style={[s.metaLabel, { marginTop: 10 }]}>Prepared By</Text>
            <Text style={s.metaValue}>{proposal.salesRepName}</Text>
          </View>
        </View>

        {/* Executive Summary */}
        <Text style={s.secTitle}>Executive Summary</Text>
        <View style={s.secBar} />
        <Text style={[s.body, { marginBottom: 18 }]}>
          {EXECUTIVE_SUMMARY_CONTENT[proposal.template]}
        </Text>

        {/* Your Services */}
        <Text style={s.secTitle}>Your Services</Text>
        <View style={s.secBar} />
        <View style={s.svcRow}>
          {proposal.selectedAgents.map(agent => (
            <View key={agent} style={s.svcCard}>
              <View style={s.svcIconWrap}>
                <Text style={s.svcIcon}>{AGENT_ICON_LABELS[agent] || 'AI'}</Text>
              </View>
              <Text style={s.svcTitle}>{SERVICE_DESCRIPTIONS[agent].title}</Text>
              <Text style={s.svcDesc}>{SERVICE_DESCRIPTIONS[agent].shortDescription}</Text>
            </View>
          ))}
        </View>

        {/* Why Mega */}
        <Text style={[s.secTitle, { marginTop: 4 }]}>Why Mega</Text>
        <View style={s.secBar} />
        <View style={s.whyRow}>
          {[
            { label: 'AI', title: 'AI-Powered', desc: 'Our proprietary AI agents work 24/7, continuously optimizing your campaigns and content for maximum performance.' },
            { label: 'DT', title: 'Dedicated Team', desc: 'Every client gets a dedicated account manager and direct access to specialists — no call centers, no runaround.' },
            { label: 'ROI', title: 'Results-Driven', desc: 'We optimize for business outcomes, not vanity metrics. Every dollar works toward qualified leads and revenue.' },
          ].map((item, i) => (
            <View key={i} style={s.whyCard}>
              <View style={[s.svcIconWrap, { marginBottom: 8 }]}>
                <Text style={{ fontSize: 8, fontWeight: 700, color: BRAND_BLUE }}>{item.label}</Text>
              </View>
              <Text style={s.whyTitle}>{item.title}</Text>
              <Text style={s.whyDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* ===== SERVICE SCOPES — single wrapping page ===== */}
      <Page size="LETTER" style={s.page} wrap>
        <Footer />
        {proposal.selectedAgents.map((agent, idx) => (
          <ServiceScope
            key={agent}
            agent={agent}
            template={proposal.template}
            isLast={idx === proposal.selectedAgents.length - 1}
          />
        ))}
      </Page>

      {/* ===== INVESTMENT SUMMARY ===== */}
      <Page size="LETTER" style={s.page} wrap>
        <Footer />

        <Text style={s.secTitle}>Investment Summary</Text>
        <View style={s.secBar} />

        <View style={s.priceRow} wrap={false}>
          {termPricings.map(({ option, pricing }, idx) => {
            const best = !isSingleTerm && idx === 0;
            const anyDiscount = termPricings.some(tp => tp.option.discountPercentage > 0);
            return (
              <View key={option.term} style={best ? s.priceCardBest : s.priceCard}>
                {best && <Text style={s.bestBadge}>Best Value</Text>}
                {!best && !isSingleTerm && <View style={{ height: 17 }} />}

                <Text style={s.pTermName}>{getTermDisplayName(option.term)}</Text>
                <Text style={s.pTermMonths}>{getTermMonths(option.term)} months</Text>

                {pricing.agents.map((ag, i) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <View style={s.pAgentRow}>
                      <Text style={s.pAgentName}>{ag.name}</Text>
                      <Text style={s.pPrice}>${Math.round(ag.finalPrice).toLocaleString()}/mo</Text>
                    </View>
                    {option.discountPercentage > 0 && (
                      <Text style={[s.pStrike, { textAlign: 'right' as const }]}>was ${ag.basePrice.toLocaleString()}/mo</Text>
                    )}
                    {!option.discountPercentage && anyDiscount && (
                      <Text style={{ fontSize: 6.5, color: '#ffffff' }}>-</Text>
                    )}
                  </View>
                ))}

                <View style={s.pDivider} />

                <View style={s.pMonthRow}>
                  <Text style={s.pMonthLabel}>Monthly Rate</Text>
                  <Text style={s.pMonthVal}>${Math.round(pricing.total).toLocaleString()}/mo</Text>
                </View>

                <View style={s.pUpBox}>
                  <Text style={s.pUpLabel}>Total Due Upfront</Text>
                  <Text style={s.pUpVal}>${Math.round(pricing.upfrontTotal).toLocaleString()}</Text>
                  {option.discountPercentage > 0 ? (
                    <Text style={s.pDisc}>{option.discountPercentage}% discount applied</Text>
                  ) : anyDiscount ? (
                    <Text style={[s.pDisc, { color: G500 }]}>Standard pricing</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {/* Savings */}
        {!isSingleTerm && termPricings.length >= 2 && (() => {
          const shortest = termPricings[termPricings.length - 1];
          const longest = termPricings[0];
          const save = Math.round(shortest.pricing.total - longest.pricing.total);
          if (save <= 0) return null;
          return (
            <View style={s.savingsBar} wrap={false}>
              <Text style={s.savingsText}>
                Save <Text style={s.savingsBold}>${save.toLocaleString()}/mo</Text> by choosing {getTermDisplayName(longest.option.term)} over {getTermDisplayName(shortest.option.term)}
              </Text>
            </View>
          );
        })()}

        {/* Next Steps */}
        <View style={s.nextBox} wrap={false}>
          <Text style={s.nextTitle}>Next Steps</Text>
          <Text style={s.nextText}>
            We're excited to partner with {proposal.companyName} and drive meaningful results. Here's how to get started:
          </Text>
          <View style={s.bullet}><Text style={s.dot}>1.</Text><Text style={s.bText}>Review this proposal and let us know if you have any questions</Text></View>
          <View style={s.bullet}><Text style={s.dot}>2.</Text><Text style={s.bText}>Select your preferred commitment term and confirm your agreement</Text></View>
          <View style={s.bullet}><Text style={s.dot}>3.</Text><Text style={s.bText}>Our team begins onboarding — campaigns go live within 14 days</Text></View>
          <Text style={s.nextCta}>
            Contact {proposal.salesRepName} at {proposal.salesRepEmail} to get started.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
