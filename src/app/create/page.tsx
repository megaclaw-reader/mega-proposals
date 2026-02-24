'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Agent, Template, ContractTerm, TermOption } from '@/lib/types';
import { calculatePricing, formatPrice, getTermDisplayName, getTermMonths } from '@/lib/pricing';
import { encodeProposal } from '@/lib/encode';

const AVAILABLE_TERMS: ContractTerm[] = ['annual', 'bi_annual', 'quarterly'];

export default function CreateProposal() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerName: '',
    companyName: '',
    template: 'leads' as Template,
    selectedAgents: [] as Agent[],
    salesRepName: '',
    salesRepEmail: '',
  });
  const [termOptions, setTermOptions] = useState<Record<ContractTerm, { selected: boolean; discount: string }>>({
    annual: { selected: true, discount: '' },
    bi_annual: { selected: false, discount: '' },
    quarterly: { selected: false, discount: '' },
    monthly: { selected: false, discount: '' },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAgentToggle = (agent: Agent) => {
    setFormData(prev => ({
      ...prev,
      selectedAgents: prev.selectedAgents.includes(agent)
        ? prev.selectedAgents.filter(a => a !== agent)
        : [...prev.selectedAgents, agent]
    }));
  };

  const handleTermToggle = (term: ContractTerm) => {
    setTermOptions(prev => ({
      ...prev,
      [term]: { ...prev[term], selected: !prev[term].selected },
    }));
  };

  const handleTermDiscount = (term: ContractTerm, discount: string) => {
    setTermOptions(prev => ({
      ...prev,
      [term]: { ...prev[term], discount },
    }));
  };

  const getSelectedTerms = (): TermOption[] => {
    return AVAILABLE_TERMS
      .filter(term => termOptions[term].selected)
      .map(term => ({
        term,
        discountPercentage: parseFloat(termOptions[term].discount) || 0,
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedTerms = getSelectedTerms();
      const encoded = encodeProposal({
        ...formData,
        contractTerm: selectedTerms[0]?.term || 'annual',
        selectedTerms,
      });
      router.push(`/proposal/${encoded}`);
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Failed to create proposal. Please try again.');
      setIsSubmitting(false);
    }
  };

  const selectedTerms = getSelectedTerms();
  const hasAgents = formData.selectedAgents.length > 0;
  const hasTerms = selectedTerms.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">MEGA Proposal Generator</h1>
            <p className="text-blue-100 mt-1">Create a branded proposal for your customer</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                <input type="text" required value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input type="text" required value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Template Type *</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="radio" name="template" value="leads" checked={formData.template === 'leads'}
                    onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value as Template }))}
                    className="mr-2 text-blue-600" />
                  <span>Leads-based (Optimized for lead generation)</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="template" value="ecom" checked={formData.template === 'ecom'}
                    onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value as Template }))}
                    className="mr-2 text-blue-600" />
                  <span>eCom-based (Optimized for eCommerce)</span>
                </label>
              </div>
            </div>

            {/* Agents Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Agents to Include *</label>
              <div className="space-y-2">
                {(['seo', 'paid_ads', 'website'] as Agent[]).map(agent => (
                  <label key={agent} className="flex items-center">
                    <input type="checkbox" checked={formData.selectedAgents.includes(agent)}
                      onChange={() => handleAgentToggle(agent)} className="mr-2 text-blue-600" />
                    <span>{agent === 'seo' ? 'SEO & GEO Agent' : agent === 'paid_ads' ? 'Paid Ads Agent' : 'Website Agent'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Commitment Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Commitment Options * <span className="text-gray-400 font-normal">(select one or more to show as pricing tiers)</span>
              </label>
              <div className="space-y-3">
                {AVAILABLE_TERMS.map(term => (
                  <div key={term} className={`border rounded-lg p-4 transition-colors ${termOptions[term].selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={termOptions[term].selected}
                          onChange={() => handleTermToggle(term)} className="mr-3 text-blue-600" />
                        <div>
                          <span className="font-medium text-gray-900">{getTermDisplayName(term)}</span>
                          <span className="text-gray-500 text-sm ml-2">({getTermMonths(term)} months, paid upfront)</span>
                        </div>
                      </label>
                      {termOptions[term].selected && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Discount:</label>
                          <input type="number" min="0" max="50" step="1"
                            value={termOptions[term].discount}
                            onChange={(e) => handleTermDiscount(term, e.target.value)}
                            placeholder="0"
                            className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Rep Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sales Rep Name *</label>
                <input type="text" required value={formData.salesRepName}
                  onChange={(e) => setFormData(prev => ({ ...prev, salesRepName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sales Rep Email *</label>
                <input type="email" required value={formData.salesRepEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, salesRepEmail: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Pricing Preview */}
            {hasAgents && hasTerms && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Preview</h3>
                <div className="space-y-4">
                  {selectedTerms.map(termOpt => {
                    const pricing = calculatePricing(formData.selectedAgents, termOpt.term, termOpt.discountPercentage);
                    return (
                      <div key={termOpt.term} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-900">{getTermDisplayName(termOpt.term)}</span>
                          {termOpt.discountPercentage > 0 && (
                            <span className="text-green-600 text-sm font-medium">{termOpt.discountPercentage}% off</span>
                          )}
                        </div>
                        {pricing.agents.map((agent, i) => (
                          <div key={i} className="flex justify-between text-sm text-gray-600">
                            <span>{agent.name}</span>
                            <span>${Math.round(agent.finalPrice).toLocaleString()}/mo</span>
                          </div>
                        ))}
                        <hr className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>Due Upfront ({pricing.termMonths} mo)</span>
                          <span className="text-blue-600">${Math.round(pricing.upfrontTotal).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end">
              <button type="submit"
                disabled={isSubmitting || !hasAgents || !hasTerms}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                {isSubmitting ? 'Generating...' : 'Generate Proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
