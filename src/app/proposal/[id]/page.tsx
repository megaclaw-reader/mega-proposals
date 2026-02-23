'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Proposal, ContractTerm } from '@/lib/types';
import { calculatePricing, formatPrice, getTermDisplayName } from '@/lib/pricing';
import { getServiceScope, EXECUTIVE_SUMMARY_CONTENT, SERVICE_DESCRIPTIONS } from '@/lib/content';
import { decodeProposal } from '@/lib/encode';
import { format } from 'date-fns';

const TERM_PRICING = {
  'seo': { annual: 699, bi_annual: 749, quarterly: 849, monthly: 999 },
  'paid_ads': { annual: 1399, bi_annual: 1499, quarterly: 1699, monthly: 1999 },
  'seo_paid_combo': { annual: 2099, bi_annual: 2249, quarterly: 2548, monthly: 2998 },
  'website': { annual: 279, bi_annual: 299, quarterly: 339, monthly: 399 }
};

const TERM_LABELS = {
  annual: 'Annual',
  bi_annual: 'Bi-Annual', 
  quarterly: 'Quarterly',
  monthly: 'Monthly'
};

export default function ProposalPage() {
  const params = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<ContractTerm>('annual');
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
      setSelectedTerm(config.contractTerm);
    }
    setLoading(false);
  }, [params.id]);

  const downloadPDF = async () => {
    if (!proposalRef.current || !proposal) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(proposalRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'in', 'letter');
      const pageWidth = 8.5;
      const pageHeight = 11;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `${proposal.companyName.replace(/\s+/g, '_')}_MEGA_SOW.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      window.print();
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
  const calculateTermPricing = (term: ContractTerm) => {
    const pricing = calculatePricing(proposal.selectedAgents, term, proposal.discountPercentage || 0);
    return pricing;
  };

  // Get pricing for selected agents based on term
  const getAgentPrice = (agent: string, term: ContractTerm) => {
    if (proposal.selectedAgents.includes('seo' as any) && proposal.selectedAgents.includes('paid_ads' as any) && 
        (agent === 'seo' || agent === 'paid_ads')) {
      // Show combo pricing when both are selected
      return TERM_PRICING['seo_paid_combo'][term];
    }
    return TERM_PRICING[agent as keyof typeof TERM_PRICING]?.[term] || 0;
  };

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
        <div className="bg-white px-8 py-8">
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
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Executive Summary</h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              {EXECUTIVE_SUMMARY_CONTENT[proposal.template]}
            </p>
          </section>

          {/* Select Your Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Services</h2>
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
            return (
              <section key={`scope-${agent}`} className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {serviceContent.title}
                  </h2>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {serviceContent.description}
                  </p>
                </div>

                {/* Highlights */}
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

                {/* Service Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {serviceContent.categories.map((category, index) => (
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

                {/* Implementation Timeline */}
                {serviceContent.timeline && (
                  <div>
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
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Investment Summary</h2>
            
            {/* Term Selector Tabs */}
            <div className="bg-gray-100 p-1 rounded-lg w-fit">
              <div className="grid grid-cols-4 gap-1">
                {(['annual', 'bi_annual', 'quarterly', 'monthly'] as ContractTerm[]).map((term) => (
                  <button
                    key={term}
                    onClick={() => setSelectedTerm(term)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      selectedTerm === term
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {TERM_LABELS[term]}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposal.selectedAgents.includes('seo') && proposal.selectedAgents.includes('paid_ads') ? (
                // Show combo pricing when both SEO and Paid Ads are selected
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-blue-200 p-6 relative">
                  <div className="absolute -top-3 left-6">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      COMBO DEAL
                    </span>
                  </div>
                  <div className="mt-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      SEO & Paid Ads Agent
                    </h3>
                    <div className="text-3xl font-bold text-gray-900 mb-4">
                      ${getAgentPrice('seo_paid_combo', selectedTerm).toLocaleString()}
                      <span className="text-base font-normal text-gray-600">/month</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Complete SEO/GEO optimization</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">AI-powered paid advertising</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Dedicated account managers</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Ongoing optimization</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Show individual pricing cards
                proposal.selectedAgents.map((agent) => (
                  <div key={agent} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {SERVICE_DESCRIPTIONS[agent].badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {SERVICE_DESCRIPTIONS[agent].title}
                    </h3>
                    <div className="text-3xl font-bold text-gray-900 mb-4">
                      ${getAgentPrice(agent, selectedTerm).toLocaleString()}
                      <span className="text-base font-normal text-gray-600">/month</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Dedicated expert assigned</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">AI-powered optimization</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Monthly strategy reviews</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Combined Monthly Investment */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Combined Monthly Investment</h3>
                <div className="text-4xl font-bold mb-2">
                  ${calculateTermPricing(selectedTerm).total.toLocaleString()}
                  <span className="text-xl font-normal">/month</span>
                </div>
                <p className="text-blue-100 text-sm">
                  {selectedTerm !== 'monthly' && (
                    <>Paid upfront: ${calculateTermPricing(selectedTerm).upfrontTotal.toLocaleString()} • </>
                  )}
                  {TERM_LABELS[selectedTerm]} commitment
                </p>
                {selectedTerm !== 'monthly' && (
                  <p className="text-blue-200 text-sm mt-1">
                    Non-monthly terms are paid upfront for the full term
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}