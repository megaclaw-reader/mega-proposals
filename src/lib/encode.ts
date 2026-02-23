import { ProposalConfig, Agent, Template, ContractTerm } from './types';

/**
 * Encode proposal config into a compact URL-safe string.
 * Format: base64url(JSON)
 */
export function encodeProposal(config: Omit<ProposalConfig, 'id' | 'createdAt'>): string {
  const payload = {
    cn: config.customerName,
    co: config.companyName,
    t: config.template,
    a: config.selectedAgents,
    ct: config.contractTerm,
    d: config.discountPercentage || 0,
    sr: config.salesRepName,
    se: config.salesRepEmail,
    ts: Date.now(),
  };
  const json = JSON.stringify(payload);
  // Use base64url encoding
  if (typeof window !== 'undefined') {
    return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Buffer.from(json).toString('base64url');
}

export function decodeProposal(encoded: string): ProposalConfig | null {
  try {
    let json: string;
    // Restore base64 padding
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof window !== 'undefined') {
      json = atob(base64);
    } else {
      json = Buffer.from(base64, 'base64').toString('utf-8');
    }
    const payload = JSON.parse(json);
    return {
      id: encoded.slice(0, 12),
      customerName: payload.cn,
      companyName: payload.co,
      template: payload.t as Template,
      selectedAgents: payload.a as Agent[],
      contractTerm: payload.ct as ContractTerm,
      discountPercentage: payload.d || undefined,
      salesRepName: payload.sr,
      salesRepEmail: payload.se,
      createdAt: new Date(payload.ts),
    };
  } catch {
    return null;
  }
}
