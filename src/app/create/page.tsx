'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Agent, Template, ContractTerm } from '@/lib/types';
import { calculatePricing, formatPrice, getTermDisplayName } from '@/lib/pricing';

export default function CreateProposal() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerName: '',
    companyName: '',
    template: 'leads' as Template,
    selectedAgents: [] as Agent[],
    contractTerm: 'annual' as ContractTerm,
    discountPercentage: '',
    salesRepName: '',
    salesRepEmail: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create proposal');
      }

      const { id } = await response.json();
      router.push(`/proposal/${id}`);
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Failed to create proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate preview pricing
  const previewPricing = calculatePricing(
    formData.selectedAgents,
    formData.contractTerm,
    parseFloat(formData.discountPercentage) || 0
  );

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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Template Type *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="template"
                    value="leads"
                    checked={formData.template === 'leads'}
                    onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value as Template }))}
                    className="mr-2 text-blue-600"
                  />
                  <span>Leads-based (Optimized for lead generation)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="template"
                    value="ecom"
                    checked={formData.template === 'ecom'}
                    onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value as Template }))}
                    className="mr-2 text-blue-600"
                  />
                  <span>eCom-based (Optimized for eCommerce)</span>
                </label>
              </div>
            </div>

            {/* Agents Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Agents to Include *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectedAgents.includes('seo')}
                    onChange={() => handleAgentToggle('seo')}
                    className="mr-2 text-blue-600"
                  />
                  <span>SEO & GEO Agent</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectedAgents.includes('paid_ads')}
                    onChange={() => handleAgentToggle('paid_ads')}
                    className="mr-2 text-blue-600"
                  />
                  <span>Paid Ads Agent</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectedAgents.includes('website')}
                    onChange={() => handleAgentToggle('website')}
                    className="mr-2 text-blue-600"
                  />
                  <span>Website Agent</span>
                </label>
              </div>
            </div>

            {/* Contract Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Term *
              </label>
              <select
                value={formData.contractTerm}
                onChange={(e) => setFormData(prev => ({ ...prev, contractTerm: e.target.value as ContractTerm }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="annual">Annual</option>
                <option value="bi_annual">Bi-Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Percentage (Optional)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.discountPercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
                placeholder="e.g., 10 for 10%"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sales Rep Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Rep Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.salesRepName}
                  onChange={(e) => setFormData(prev => ({ ...prev, salesRepName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Rep Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.salesRepEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, salesRepEmail: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Pricing Preview */}
            {formData.selectedAgents.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Preview</h3>
                <div className="space-y-2">
                  {previewPricing.agents.map((agent, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700">{agent.name}</span>
                      <div className="text-right">
                        {previewPricing.discountAmount > 0 ? (
                          <>
                            <span className="text-gray-500 line-through mr-2">
                              {formatPrice(agent.basePrice)}
                            </span>
                            <span className="text-green-600 font-semibold">
                              {formatPrice(agent.finalPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold">{formatPrice(agent.finalPrice)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <hr className="my-2" />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total ({getTermDisplayName(formData.contractTerm)})</span>
                    <span className="text-blue-600">{formatPrice(previewPricing.total)}</span>
                  </div>
                  {previewPricing.discountAmount > 0 && (
                    <div className="text-sm text-green-600">
                      Discount: -{formatPrice(previewPricing.discountAmount)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || formData.selectedAgents.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                {isSubmitting ? 'Generating...' : 'Generate Proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}