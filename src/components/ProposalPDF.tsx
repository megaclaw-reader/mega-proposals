import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
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

// ── Colors ──
const BLUE = '#2563eb';
const BLUE_LIGHT = '#eff6ff';
const G50 = '#f9fafb';
const G100 = '#f3f4f6';
const G200 = '#e5e7eb';
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
  footerLine: { position: 'absolute', bottom: 38, left: 44, right: 44, borderBottomWidth: 0.5, borderBottomColor: G200 },
  footerBrand: { position: 'absolute', bottom: 22, left: 44, fontSize: 7.5, color: G400 },
  pageNum: { position: 'absolute', bottom: 22, right: 44, fontSize: 7.5, color: G400 },

  headerBar: { backgroundColor: BLUE, marginHorizontal: -44, marginTop: -44, paddingHorizontal: 44, paddingTop: 32, paddingBottom: 28, marginBottom: 28 },
  headerMega: { fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 12, letterSpacing: 3, textTransform: 'uppercase' as const },
  headerTitle: { fontSize: 26, fontWeight: 700, color: '#ffffff', marginBottom: 6 },
  headerSub: { fontSize: 12, fontWeight: 500, color: '#dbeafe' },

  metaRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 20 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 7.5, fontWeight: 600, color: G400, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 2, marginTop: 8 },
  metaValue: { fontSize: 10, fontWeight: 500, color: G900 },
  metaValueSub: { fontSize: 9, color: G600 },

  secTitle: { fontSize: 15, fontWeight: 700, color: G900, marginBottom: 10 },
  secBar: { borderBottomWidth: 2, borderBottomColor: BLUE, marginBottom: 14, width: 36 },
  subTitle: { fontSize: 11, fontWeight: 600, color: G900, marginBottom: 8 },
  label: { fontSize: 7, fontWeight: 600, color: G400, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },

  body: { fontSize: 9, lineHeight: 1.6, color: G700 },

  svcRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 14 },
  svcCard: { flex: 1, borderWidth: 1, borderColor: G200, borderRadius: 5, padding: 12 },
  svcBadge: { backgroundColor: BLUE_LIGHT, color: BLUE, fontSize: 6.5, fontWeight: 700, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' as const, marginBottom: 6, letterSpacing: 0.4 },
  svcTitle: { fontSize: 10, fontWeight: 600, color: G900, marginBottom: 3 },
  svcDesc: { fontSize: 7.5, color: G600, lineHeight: 1.4 },

  hlBox: { backgroundColor: BLUE_LIGHT, borderRadius: 5, padding: 12, marginBottom: 10 },
  hlRow: { flexDirection: 'row' as const, marginBottom: 5 },
  hlIcon: { width: 12, height: 12, borderRadius: 6, backgroundColor: BLUE, marginRight: 7, marginTop: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  hlCheck: { color: '#ffffff', fontSize: 6.5, fontWeight: 700 },
  hlText: { flex: 1, fontSize: 8, color: G800, lineHeight: 1.5 },

  catRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 8 },
  catCard: { flex: 1, backgroundColor: G50, borderWidth: 1, borderColor: G200, borderRadius: 4, padding: 10 },
  catTitle: { fontSize: 8.5, fontWeight: 600, color: G900, marginBottom: 5 },
  bullet: { flexDirection: 'row' as const, marginBottom: 2.5 },
  dot: { color: BLUE, fontSize: 7, marginRight: 4, marginTop: 0.5 },
  bText: { flex: 1, fontSize: 7, color: G700, lineHeight: 1.4 },

  tlRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 8 },
  tlCard: { flex: 1, borderWidth: 1, borderColor: G200, borderRadius: 4, padding: 10 },
  tlPhase: { fontSize: 8.5, fontWeight: 600, color: BLUE, marginBottom: 5 },

  // Pricing
  priceRow: { flexDirection: 'row' as const, gap: 10, marginBottom: 14, alignItems: 'stretch' as const },
  priceCard: { flex: 1, borderWidth: 1.5, borderColor: G200, borderRadius: 7, padding: 14, backgroundColor: '#ffffff' },
  priceCardBest: { flex: 1, borderWidth: 2, borderColor: BLUE, borderRadius: 7, padding: 14, backgroundColor: BLUE_LIGHT },
  bestBadge: { backgroundColor: BLUE, color: '#ffffff', fontSize: 6.5, fontWeight: 700, paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 8, alignSelf: 'center' as const, marginBottom: 6, letterSpacing: 0.4, textTransform: 'uppercase' as const },
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
  pUpBox: { backgroundColor: G100, borderRadius: 5, padding: 10, marginTop: 8, alignItems: 'center' as const },
  pUpLabel: { fontSize: 7.5, color: G500, marginBottom: 3 },
  pUpVal: { fontSize: 18, fontWeight: 700, color: BLUE },
  pDisc: { fontSize: 7.5, color: GREEN_600, fontWeight: 500, marginTop: 3 },

  savingsBar: { backgroundColor: GREEN_50, borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 5, padding: 8, alignItems: 'center' as const, marginBottom: 16 },
  savingsText: { fontSize: 8.5, fontWeight: 500, color: GREEN_800 },
  savingsBold: { fontWeight: 700 },

  nextBox: { backgroundColor: G50, borderWidth: 1, borderColor: G200, borderRadius: 5, padding: 16 },
  nextTitle: { fontSize: 11, fontWeight: 600, color: G900, marginBottom: 6 },
  nextText: { fontSize: 8.5, color: G700, lineHeight: 1.6, marginBottom: 4 },
  nextCta: { fontSize: 9, fontWeight: 600, color: BLUE, marginTop: 4 },

  // Agent separator
  agentSep: { borderBottomWidth: 1, borderBottomColor: G200, marginTop: 14, marginBottom: 14 },
});

function pairUp<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
}

function Footer() {
  return (
    <>
      <View style={s.footerLine} fixed />
      <Text style={s.footerBrand} fixed>MEGA AI  •  gomega.ai</Text>
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
      {/* Section header + description + highlights — keep together to prevent orphaning */}
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

      {/* Deliverables — label grouped with first row to prevent orphaning */}
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

      {/* Timeline — heading grouped with first row to prevent orphaning */}
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

      {/* Separator between agents */}
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
        <View style={s.headerBar}>
          <Text style={s.headerMega}>MEGA</Text>
          <Text style={s.headerTitle}>Statement of Work</Text>
          <Text style={s.headerSub}>
            {proposal.selectedAgents.map(a => SERVICE_DESCRIPTIONS[a].title).join('  |  ')}
          </Text>
        </View>

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

        <Text style={s.secTitle}>Executive Summary</Text>
        <View style={s.secBar} />
        <Text style={[s.body, { marginBottom: 20 }]}>
          {EXECUTIVE_SUMMARY_CONTENT[proposal.template]}
        </Text>

        <Text style={s.secTitle}>Your Services</Text>
        <View style={s.secBar} />
        <View style={s.svcRow}>
          {proposal.selectedAgents.map(agent => (
            <View key={agent} style={s.svcCard}>
              <Text style={s.svcBadge}>{SERVICE_DESCRIPTIONS[agent].badge}</Text>
              <Text style={s.svcTitle}>{SERVICE_DESCRIPTIONS[agent].title}</Text>
              <Text style={s.svcDesc}>{SERVICE_DESCRIPTIONS[agent].shortDescription}</Text>
            </View>
          ))}
        </View>

        {/* Why MEGA section to fill cover page */}
        <Text style={[s.secTitle, { marginTop: 8 }]}>Why MEGA</Text>
        <View style={s.secBar} />
        <View style={{ flexDirection: 'row' as const, gap: 10 }}>
          {[
            { title: 'AI-Powered', desc: 'Our proprietary AI agents work 24/7, continuously optimizing your campaigns and content for maximum performance.' },
            { title: 'Dedicated Team', desc: 'Every client gets a dedicated account manager and direct access to specialists — no call centers, no runaround.' },
            { title: 'Results-Driven', desc: 'We optimize for business outcomes, not vanity metrics. Every dollar in your budget is working toward qualified leads and revenue.' },
          ].map((item, i) => (
            <View key={i} style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: 600, color: BLUE, marginBottom: 4 }}>{item.title}</Text>
              <Text style={{ fontSize: 7.5, color: G700, lineHeight: 1.5 }}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* ===== ALL SERVICE SCOPES — single wrapping page, content flows naturally ===== */}
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
            // Any term has discount? Show strikethrough row on all for alignment
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
                    {/* Show strikethrough on its own line for clarity */}
                    {option.discountPercentage > 0 && (
                      <Text style={[s.pStrike, { textAlign: 'right' as const }]}>was ${ag.basePrice.toLocaleString()}/mo</Text>
                    )}
                    {/* Placeholder line when other cards have discounts for vertical alignment */}
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
          <View style={s.bullet}><Text style={s.dot}>3.</Text><Text style={s.bText}>Our team begins onboarding — campaigns go live within 30 days</Text></View>
          <Text style={s.nextCta}>
            Contact {proposal.salesRepName} at {proposal.salesRepEmail} to get started.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
