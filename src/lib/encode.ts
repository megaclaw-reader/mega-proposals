import { ProposalConfig, Agent, Template, ContractTerm, TermOption } from './types';

/**
 * Encode proposal config into a compact URL-safe string.
 * Format: base64url(JSON)
 */
export function encodeProposal(config: Omit<ProposalConfig, 'id' | 'createdAt'>): string {
  const payload: Record<string, unknown> = {
    cn: config.customerName,
    co: config.companyName,
    t: config.template,
    a: config.selectedAgents,
    sr: config.salesRepName,
    se: config.salesRepEmail,
    ts: Date.now(),
  };

  // New multi-term format
  if (config.selectedTerms && config.selectedTerms.length > 0) {
    payload.st = config.selectedTerms.map(t => ({
      t: t.term,
      d: t.discountPercentage || 0,
    }));
  } else {
    // Legacy single-term format
    payload.ct = config.contractTerm;
    payload.d = config.discountPercentage || 0;
  }

  const json = JSON.stringify(payload);
  if (typeof window !== 'undefined') {
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Buffer.from(json).toString('base64url');
}

export function decodeProposal(encoded: string): ProposalConfig | null {
  try {
    let json: string;
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof window !== 'undefined') {
      json = atob(base64);
    } else {
      json = Buffer.from(base64, 'base64').toString('utf-8');
    }
    const payload = JSON.parse(json);

    // Parse multi-term or legacy single-term
    let selectedTerms: TermOption[] | undefined;
    let contractTerm: ContractTerm = 'annual';
    let discountPercentage: number | undefined;

    if (payload.st && Array.isArray(payload.st)) {
      selectedTerms = payload.st.map((t: { t: string; d: number }) => ({
        term: t.t as ContractTerm,
        discountPercentage: t.d || 0,
      }));
      // Use first term as the primary for backward compat
      contractTerm = selectedTerms![0].term;
      discountPercentage = selectedTerms![0].discountPercentage || undefined;
    } else {
      contractTerm = payload.ct as ContractTerm;
      discountPercentage = payload.d || undefined;
    }

    return {
      id: encoded.slice(0, 12),
      customerName: payload.cn,
      companyName: payload.co,
      template: payload.t as Template,
      selectedAgents: payload.a as Agent[],
      contractTerm,
      discountPercentage,
      selectedTerms,
      salesRepName: payload.sr,
      salesRepEmail: payload.se,
      createdAt: new Date(payload.ts),
    };
  } catch {
    return null;
  }
}
