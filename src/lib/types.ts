export type Agent = 'seo' | 'paid_ads' | 'website';

export type Template = 'leads' | 'ecom';

export type ContractTerm = 'annual' | 'bi_annual' | 'quarterly' | 'monthly';

export interface TermOption {
  term: ContractTerm;
  discountPercentage: number;
}

export interface ProposalConfig {
  id: string;
  customerName: string;
  companyName: string;
  template: Template;
  selectedAgents: Agent[];
  /** @deprecated Use selectedTerms instead */
  contractTerm: ContractTerm;
  /** @deprecated Use selectedTerms instead */
  discountPercentage?: number;
  /** Multiple term options with per-term discounts */
  selectedTerms?: TermOption[];
  salesRepName: string;
  salesRepEmail: string;
  createdAt: Date;
  isLocked?: boolean;
}

export interface SignatureData {
  fullName: string;
  email: string;
  signedAt: Date;
  ipAddress: string;
  userAgent: string;
  agreedToTerms: boolean;
}

export interface Proposal extends ProposalConfig {
  signature?: SignatureData;
  pricing: PricingBreakdown;
}

export interface PricingBreakdown {
  agents: Array<{
    agent: Agent | 'seo_paid_combo';
    name: string;
    basePrice: number;
    finalPrice: number;
  }>;
  subtotal: number;
  discountAmount: number;
  total: number;
  /** Upfront total (monthly rate × term months, after discount) */
  upfrontTotal: number;
  /** Number of months in the term */
  termMonths: number;
  term: ContractTerm;
}

export interface ServiceHighlight {
  title: string;
  description: string;
}

export interface ServiceCategory {
  name: string;
  items: string[];
}

export interface TimelinePhase {
  phase: string;
  items: string[];
}