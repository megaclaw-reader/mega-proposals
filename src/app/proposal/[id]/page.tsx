'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Proposal } from '@/lib/types';
import { calculatePricing, formatPrice, getTermDisplayName } from '@/lib/pricing';
import { getServiceScope, EXECUTIVE_SUMMARY_CONTENT, IMPLEMENTATION_TIMELINE, SERVICE_DESCRIPTIONS } from '@/lib/content';
import { decodeProposal } from '@/lib/encode';
import { format } from 'date-fns';

export default function ProposalPage() {
  const params = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const proposalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = params.id as string;
    const config = decodeProposal(id);
    if (config) {
      const pricing = calculatePricing(
        config.selectedAgents,
        config.contractTerm,
        config.discountPercentage || 0
      );
      setProposal({ ...config, pricing });
    }
    setLoading(false);
  }, [params.id]);

  const downloadPDF = async () => {
    try {
      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      if (proposalRef.current) {
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
          filename: `${proposal?.companyName.replace(/\s+/g, '_')}_Proposal_${proposal?.id}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
        };

        html2pdf().set(opt).from(proposalRef.current).save();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposal Not Found</h1>
          <p className="text-gray-600">The proposal you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar - Fixed at top, not included in PDF */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">Proposal ID: {proposal.id}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Proposal Content */}
      <div ref={proposalRef} className="max-w-4xl mx-auto bg-white shadow-lg">
        {/* Header */}
        <div className="bg-white border-b-4 border-blue-600 px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <img src="/mega-logo.png" alt="MEGA" className="h-12 w-12 rounded-lg" />
                <h1 className="text-4xl font-bold text-blue-600">MEGA</h1>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Proposal</h2>
              <p className="text-lg text-gray-600 mt-2">
                {proposal.selectedAgents.map(agent => 
                  SERVICE_DESCRIPTIONS[agent].title
                ).join(' + ')}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>Prepared for: <strong>{proposal.customerName}</strong></p>
              <p>Company: <strong>{proposal.companyName}</strong></p>
              <p>Date: <strong>{format(new Date(proposal.createdAt), 'MMMM dd, yyyy')}</strong></p>
              <p>Prepared by: <strong>{proposal.salesRepName}</strong></p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-12">
          {/* Executive Summary */}
          <section>
            <div className="border-l-4 border-blue-600 pl-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {EXECUTIVE_SUMMARY_CONTENT[proposal.template]}
              </p>
            </div>
          </section>

          {/* Selected Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Selected Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proposal.pricing.agents.map((pricingAgent, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold text-blue-600 mb-3">
                    {pricingAgent.name}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {pricingAgent.agent === 'seo_paid_combo' 
                      ? 'AI-powered SEO, GEO optimization, and intelligent paid advertising — bundled for maximum impact.'
                      : pricingAgent.agent === 'seo' 
                        ? SERVICE_DESCRIPTIONS.seo.shortDescription
                        : pricingAgent.agent === 'paid_ads'
                          ? SERVICE_DESCRIPTIONS.paid_ads.shortDescription
                          : SERVICE_DESCRIPTIONS.website.shortDescription
                    }
                  </p>
                  <div className="text-right">
                    {proposal.pricing.discountAmount > 0 ? (
                      <>
                        <span className="text-gray-500 line-through text-lg mr-2">
                          {formatPrice(pricingAgent.basePrice)}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(pricingAgent.finalPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(pricingAgent.finalPrice)}
                      </span>
                    )}
                    <span className="text-gray-600 text-sm block">per month</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Service Scope Sections */}
          {proposal.selectedAgents.map((agent) => {
            const serviceContent = getServiceScope(agent, proposal.template);
            return (
              <section key={`scope-${agent}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {serviceContent.title} - Service Scope
                </h2>
                <p className="text-gray-700 mb-6 text-lg">
                  {serviceContent.description}
                </p>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Deliverables:</h3>
                  <ul className="space-y-3">
                    {serviceContent.deliverables.map((deliverable, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-3 mt-1">✓</span>
                        <span className="text-gray-700">{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}

          {/* Implementation Timeline */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Implementation Timeline</h2>
            <p className="text-gray-700 mb-6 text-lg">
              Our proven 90-day implementation roadmap ensures rapid deployment and measurable results.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(IMPLEMENTATION_TIMELINE).map(([phase, tasks]) => (
                <div key={phase} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4">{phase}</h3>
                  <ul className="space-y-2">
                    {tasks.map((task, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2 mt-1 text-sm">•</span>
                        <span className="text-gray-700 text-sm">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Investment Summary */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Investment Summary</h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
              <div className="space-y-6">
                {proposal.pricing.agents.map((agent, index) => (
                  <div key={index} className="flex justify-between items-center pb-4 border-b border-blue-200 last:border-b-0 last:pb-0">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-gray-600 text-sm">{getTermDisplayName(proposal.contractTerm)} billing</p>
                    </div>
                    <div className="text-right">
                      {proposal.pricing.discountAmount > 0 ? (
                        <>
                          <span className="text-gray-500 line-through text-lg">
                            {formatPrice(agent.basePrice)}/mo
                          </span>
                          <div className="text-2xl font-bold text-green-600">
                            {formatPrice(agent.finalPrice)}/mo
                          </div>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(agent.finalPrice)}/mo
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="bg-white rounded-lg p-6 border border-blue-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Monthly Rate</h3>
                      <p className="text-gray-600">{getTermDisplayName(proposal.contractTerm)} commitment</p>
                      {proposal.pricing.discountAmount > 0 && (
                        <p className="text-green-600 font-semibold">
                          Monthly savings: {formatPrice(proposal.pricing.discountAmount)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {formatPrice(proposal.pricing.total)}/mo
                      </div>
                    </div>
                  </div>

                  {proposal.pricing.termMonths > 1 && (
                    <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Due Upfront</h3>
                        <p className="text-gray-600">
                          {formatPrice(proposal.pricing.total)}/mo × {proposal.pricing.termMonths} months
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {formatPrice(proposal.pricing.upfrontTotal)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
