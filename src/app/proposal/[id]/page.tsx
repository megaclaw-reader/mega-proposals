'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Proposal, ContractTerm } from '@/lib/types';
import { calculatePricing, formatPrice, getTermDisplayName } from '@/lib/pricing';
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
    if (!proposalRef.current || !proposal) return;
    setGenerating(true);
    try {
      const { toCanvas } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      // Find sections with page break hints
      const breakElements = proposalRef.current.querySelectorAll('.break-before-page');
      const containerTop = proposalRef.current.getBoundingClientRect().top;
      
      // Collect break points (pixel positions relative to container)
      const breakPoints: number[] = [];
      breakElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        breakPoints.push(rect.top - containerTop);
      });

      // Render the full proposal as one canvas
      const canvas = await toCanvas(proposalRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => {
          // Skip the action bar
          return !node.classList?.contains('print:hidden');
        },
      });

      const pdf = new jsPDF('p', 'in', 'letter');
      const pageWidthIn = 8.5;
      const pageHeightIn = 11;

      // No extra margin — the content div already has its own padding
      const pxPerInch = canvas.width / pageWidthIn;
      const pageHeightPx = pageHeightIn * pxPerInch;

      const scale = canvas.width / proposalRef.current.offsetWidth;

      // Build list of page slices using break points
      const slicePoints = [0]; // start of document
      for (const bp of breakPoints) {
        const bpPx = bp * scale;
        if (bpPx > 0) slicePoints.push(bpPx);
      }

      // Now split each section into pages if it's taller than one page
      const pages: { y: number; height: number }[] = [];
      for (let i = 0; i < slicePoints.length; i++) {
        const sectionStart = slicePoints[i];
        const sectionEnd = i + 1 < slicePoints.length ? slicePoints[i + 1] : canvas.height;
        let sectionHeight = sectionEnd - sectionStart;
        
        if (sectionHeight <= pageHeightPx) {
          pages.push({ y: sectionStart, height: sectionHeight });
        } else {
          // Split oversized section into multiple pages
          let y = sectionStart;
          while (y < sectionEnd) {
            const remaining = sectionEnd - y;
            const h = Math.min(remaining, pageHeightPx);
            pages.push({ y, height: h });
            y += h;
          }
        }
      }

      // Render each page slice
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        
        const { y, height } = pages[i];
        
        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.ceil(height);
        const ctx = pageCanvas.getContext('2d');
        if (!ctx) continue;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, -y);
        
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        const imgHeightIn = (pageCanvas.height / pxPerInch);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthIn, imgHeightIn);
      }

      const filename = `${proposal.companyName.replace(/\s+/g, '_')}_MEGA_SOW.pdf`;
      pdf.save(filename);
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

          {/* Your Services */}
          <section>
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
            return (
              <section key={`scope-${agent}`} className="space-y-8 break-before-page">
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
          <section className="space-y-8 break-before-page">
            <h2 className="text-2xl font-bold text-gray-900">Investment Summary</h2>
            <p className="text-sm text-gray-500 font-medium">{getTermDisplayName(proposal.contractTerm)} Commitment</p>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposal.pricing.agents.map((pricingAgent, index) => (
                <div key={index} className={`rounded-lg border p-6 ${
                  pricingAgent.agent === 'seo_paid_combo' 
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {pricingAgent.agent === 'seo_paid_combo' ? 'SEO/GEO + PAID ADS' 
                        : pricingAgent.agent === 'seo' ? 'SEO/GEO' 
                        : pricingAgent.agent === 'paid_ads' ? 'PAID ADS' 
                        : 'WEB'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{pricingAgent.name}</h3>
                  <div className="mb-4">
                    {proposal.pricing.termMonths > 1 ? (
                      // Show upfront total per agent
                      <>
                        {proposal.pricing.discountAmount > 0 && (
                          <span className="text-lg text-gray-400 line-through mr-2">
                            ${(pricingAgent.basePrice * proposal.pricing.termMonths).toLocaleString()}
                          </span>
                        )}
                        <div className="text-3xl font-bold text-gray-900">
                          ${Math.round(pricingAgent.finalPrice * proposal.pricing.termMonths).toLocaleString()}
                        </div>
                        <span className="text-sm text-gray-500">${Math.round(pricingAgent.finalPrice).toLocaleString()}/mo × {proposal.pricing.termMonths} months</span>
                      </>
                    ) : (
                      // Monthly — show per month
                      <>
                        {proposal.pricing.discountAmount > 0 && (
                          <span className="text-lg text-gray-400 line-through mr-2">
                            ${pricingAgent.basePrice.toLocaleString()}/mo
                          </span>
                        )}
                        <div className="text-3xl font-bold text-gray-900">
                          ${Math.round(pricingAgent.finalPrice).toLocaleString()}
                          <span className="text-base font-normal text-gray-600">/mo</span>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{
                    pricingAgent.agent === 'seo_paid_combo' ? 'Full service SEO/GEO optimization and AI-powered paid advertising, bundled for maximum impact'
                    : pricingAgent.agent === 'seo' ? 'Complete SEO/GEO strategy, content creation, technical optimization, link building, and ongoing management'
                    : pricingAgent.agent === 'paid_ads' ? 'Full service ads management, campaign launches, budget optimization, audience targeting, and automated reporting'
                    : 'Full website development, hosting, security, analytics, and unlimited changes with 2-day turnaround'
                  }</p>
                </div>
              ))}
            </div>

            {/* Total Investment */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  {proposal.pricing.termMonths > 1 ? 'Total Due Upfront' : 'Monthly Investment'}
                </h3>
                <div className="text-4xl font-bold mb-2">
                  ${proposal.pricing.termMonths > 1 
                    ? Math.round(proposal.pricing.upfrontTotal).toLocaleString()
                    : Math.round(proposal.pricing.total).toLocaleString()}
                  {proposal.pricing.termMonths === 1 && <span className="text-xl font-normal">/mo</span>}
                </div>
                {proposal.pricing.termMonths > 1 && (
                  <p className="text-blue-100 text-sm">
                    ${Math.round(proposal.pricing.total).toLocaleString()}/mo × {proposal.pricing.termMonths} months ({getTermDisplayName(proposal.contractTerm).toLowerCase()} commitment)
                  </p>
                )}
                {proposal.pricing.discountAmount > 0 && (
                  <p className="text-green-300 text-sm mt-1">
                    Includes ${Math.round(proposal.pricing.discountAmount * proposal.pricing.termMonths).toLocaleString()} in savings with your discount
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