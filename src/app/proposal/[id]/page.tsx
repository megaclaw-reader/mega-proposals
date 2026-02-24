'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Proposal, ContractTerm, TermOption, PricingBreakdown } from '@/lib/types';
import { calculatePricing, formatPrice, getTermDisplayName, getTermMonths } from '@/lib/pricing';
import { getServiceScope, EXECUTIVE_SUMMARY_CONTENT, SERVICE_DESCRIPTIONS } from '@/lib/content';
import { decodeProposal } from '@/lib/encode';
import { format } from 'date-fns';

export default function ProposalPage() {
  const params = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
    if (!proposal) return;
    setGenerating(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { ProposalPDF } = await import('@/components/ProposalPDF');
      const React = await import('react');

      const doc = React.createElement(ProposalPDF, { proposal }) as any;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${proposal.companyName.replace(/\s+/g, '_')}_MEGA_SOW.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF generation failed: ' + (error as Error).message);
    } finally {
      setGenerating(false);
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

  // Calculate pricing for different terms for the investment summary
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar - Fixed at top, not included in PDF */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">Proposal ID: {proposal.id}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadPDF}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              {generating ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Proposal Content */}
      <div ref={proposalRef} className="max-w-6xl mx-auto bg-white">
        {/* Header */}
        <div data-pdf-block className="bg-white px-8 py-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <img src="/mega-wordmark.svg" alt="MEGA" className="h-10 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Statement of Work</h1>
              <p className="text-xl text-blue-600 font-semibold">
                {proposal.selectedAgents.map(agent => SERVICE_DESCRIPTIONS[agent].title).join(' + ')}
              </p>
            </div>
            <div className="text-right text-sm text-gray-700 space-y-1">
              <p><span className="font-semibold">Prepared for:</span> {proposal.customerName}</p>
              <p><span className="font-semibold">Company:</span> {proposal.companyName}</p>
              <p><span className="font-semibold">Date:</span> {format(new Date(proposal.createdAt), 'MMMM dd, yyyy')}</p>
              <p><span className="font-semibold">Prepared by:</span> {proposal.salesRepName}</p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-12">
          {/* Executive Summary */}
          <section data-pdf-block>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Executive Summary</h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              {EXECUTIVE_SUMMARY_CONTENT[proposal.template]}
            </p>
          </section>

          {/* Your Services */}
          <section data-pdf-block>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposal.selectedAgents.map((agent) => (
                <div key={agent} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700`}>
                      {SERVICE_DESCRIPTIONS[agent].badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {SERVICE_DESCRIPTIONS[agent].title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {SERVICE_DESCRIPTIONS[agent].shortDescription}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Service Scope Sections */}
          {proposal.selectedAgents.map((agent) => {
            const serviceContent = getServiceScope(agent, proposal.template);
            const categories = serviceContent.categories || [];
            
            return (
              <section key={`scope-${agent}`} className="space-y-8">
                {/* Intro + Highlights — own block, force page break before agent */}
                <div data-pdf-block className="break-before-page">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {serviceContent.title}
                  </h2>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    {serviceContent.description}
                  </p>
                  <div className="bg-blue-50 rounded-lg p-6 space-y-4">
                    {serviceContent.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-1 mr-3">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-800 font-medium text-sm">
                            {highlight}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Categories — each ROW of 2 cards is a separate block with a label */}
                {Array.from({ length: Math.ceil(categories.length / 2) }, (_, rowIndex) => {
                  const rowCats = categories.slice(rowIndex * 2, rowIndex * 2 + 2);
                  return (
                    <div key={`row-${rowIndex}`} data-pdf-block>
                      {rowIndex === 0 ? (
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                          {serviceContent.title.replace(' Services Scope', '')} — Service Deliverables
                        </h3>
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                          {serviceContent.title.replace(' Services Scope', '')} — Deliverables (continued)
                        </h3>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rowCats.map((category, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-3">{category.name}</h4>
                            <ul className="space-y-2">
                              {category.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-start text-sm">
                                  <span className="text-blue-600 mr-2 mt-0.5">•</span>
                                  <span className="text-gray-700">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Implementation Timeline */}
                {serviceContent.timeline && (
                  <div data-pdf-block>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Implementation Timeline</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {serviceContent.timeline.map((phase, index) => (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-5">
                          <h4 className="font-semibold text-blue-600 mb-3">{phase.phase}</h4>
                          <ul className="space-y-2">
                            {phase.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start text-sm">
                                <span className="text-blue-600 mr-2 mt-0.5">•</span>
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {/* Investment Summary */}
          <section data-pdf-block className="space-y-8 break-before-page">
            <h2 className="text-2xl font-bold text-gray-900">Investment Summary</h2>

            {(() => {
              // Build pricing for all selected terms
              const terms: TermOption[] = proposal.selectedTerms && proposal.selectedTerms.length > 0
                ? proposal.selectedTerms
                : [{ term: proposal.contractTerm, discountPercentage: proposal.discountPercentage || 0 }];
              
              const termPricings: { option: TermOption; pricing: PricingBreakdown }[] = terms.map(opt => ({
                option: opt,
                pricing: calculatePricing(proposal.selectedAgents, opt.term, opt.discountPercentage),
              }));

              const isSingleTerm = termPricings.length === 1;

              return (
                <>
                  {/* Term comparison cards */}
                  <div className={`grid gap-6 ${termPricings.length === 1 ? 'grid-cols-1 max-w-md' : termPricings.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                    {termPricings.map(({ option, pricing }, termIndex) => {
                      const isLowestPrice = !isSingleTerm && pricing.upfrontTotal === Math.min(...termPricings.map(tp => tp.pricing.upfrontTotal));
                      const isBestValue = !isSingleTerm && termIndex === 0; // Longest term = best value
                      return (
                        <div key={option.term} className={`rounded-lg border-2 p-6 relative ${
                          isBestValue ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}>
                          {isBestValue && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                Best Value
                              </span>
                            </div>
                          )}
                          
                          <div className="text-center mb-4 mt-1">
                            <h3 className="text-xl font-bold text-gray-900">{getTermDisplayName(option.term)}</h3>
                            <p className="text-sm text-gray-500">{getTermMonths(option.term)} months</p>
                          </div>

                          {/* Per-agent breakdown */}
                          <div className="space-y-3 mb-4">
                            {pricing.agents.map((agent, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">{agent.name}</span>
                                <div className="text-right">
                                  {option.discountPercentage > 0 ? (
                                    <>
                                      <span className="text-gray-400 line-through text-xs mr-1">${agent.basePrice.toLocaleString()}</span>
                                      <span className="font-semibold text-gray-900">${Math.round(agent.finalPrice).toLocaleString()}/mo</span>
                                    </>
                                  ) : (
                                    <span className="font-semibold text-gray-900">${agent.finalPrice.toLocaleString()}/mo</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <hr className="my-4" />

                          {/* Monthly total */}
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-700 font-medium">Monthly Rate</span>
                            <span className="text-lg font-bold text-gray-900">${Math.round(pricing.total).toLocaleString()}/mo</span>
                          </div>

                          {/* Upfront total */}
                          <div className="bg-gray-100 rounded-lg p-4 text-center mt-4">
                            <p className="text-sm text-gray-500 mb-1">Total Due Upfront</p>
                            <p className="text-3xl font-bold text-blue-600">${Math.round(pricing.upfrontTotal).toLocaleString()}</p>
                            {option.discountPercentage > 0 && (
                              <p className="text-green-600 text-sm mt-1 font-medium">
                                {option.discountPercentage}% discount applied
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Savings comparison (multi-term only) */}
                  {!isSingleTerm && termPricings.length >= 2 && (() => {
                    const shortestTerm = termPricings[termPricings.length - 1];
                    const longestTerm = termPricings[0];
                    const monthlySavings = Math.round(shortestTerm.pricing.total - longestTerm.pricing.total);
                    if (monthlySavings <= 0) return null;
                    return (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-green-800 font-medium">
                          Save <span className="font-bold">${monthlySavings.toLocaleString()}/mo</span> by choosing {getTermDisplayName(longestTerm.option.term)} over {getTermDisplayName(shortestTerm.option.term)}
                        </p>
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </section>
        </div>
      </div>
    </div>
  );
}