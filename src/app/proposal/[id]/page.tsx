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

      const el = proposalRef.current;

      // Clone into offscreen container at fixed letter width
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:768px;background:#fff;';
      
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.cssText = 'width:768px;max-width:768px;margin:0;background:#fff;';
      
      // Remove action bar from clone
      clone.querySelectorAll('.print\\:hidden').forEach(ab => ab.remove());
      
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);
      await new Promise(r => setTimeout(r, 300));

      // Find ALL blocks that should never be split across pages
      // This includes: .pdf-block (cards, timeline phases, highlights, etc.)
      // and .break-before-page elements (force new page)
      const cloneTop = clone.getBoundingClientRect().top;
      const pxWidth = 768;

      interface Block {
        top: number;    // px from clone top
        bottom: number; // px from clone top
        forceBreak: boolean; // starts a new page
      }

      const blocks: Block[] = [];
      
      // Get all marked blocks
      const allBlocks = clone.querySelectorAll('[data-pdf-block]');
      allBlocks.forEach(block => {
        const rect = block.getBoundingClientRect();
        blocks.push({
          top: rect.top - cloneTop,
          bottom: rect.bottom - cloneTop,
          forceBreak: block.classList.contains('break-before-page'),
        });
      });

      // Sort by position
      blocks.sort((a, b) => a.top - b.top);

      // If no blocks found, fall back to using all direct children
      if (blocks.length === 0) {
        const children = clone.children;
        for (let i = 0; i < children.length; i++) {
          const rect = children[i].getBoundingClientRect();
          blocks.push({
            top: rect.top - cloneTop,
            bottom: rect.bottom - cloneTop,
            forceBreak: false,
          });
        }
      }

      const totalHeight = clone.scrollHeight;

      // Render the full clone as one canvas
      const fullCanvas = await toCanvas(clone, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: pxWidth,
        height: totalHeight,
      });

      document.body.removeChild(wrapper);

      const pdf = new jsPDF('p', 'pt', 'letter');
      const pageW = 612;
      const pageH = 792;
      const scale = fullCanvas.width / pxWidth;
      const pxToPoints = pageW / (pxWidth * scale);
      const pageHeightPx = pageH / pxToPoints; // page height in source pixels

      // Pack blocks onto pages using bin-packing
      // Rule: never split a block, force new page on forceBreak
      interface PageSlice { startPx: number; endPx: number; }
      const pages: PageSlice[] = [];
      let currentPageStart = 0;
      let currentPageEnd = 0;

      for (const block of blocks) {
        if (block.forceBreak && currentPageEnd > currentPageStart) {
          // Flush current page and start new one
          pages.push({ startPx: currentPageStart, endPx: currentPageEnd });
          currentPageStart = block.top;
          currentPageEnd = block.bottom;
        } else if (block.bottom - currentPageStart > pageHeightPx) {
          // This block would overflow the current page
          if (currentPageEnd > currentPageStart) {
            // Flush what we have
            pages.push({ startPx: currentPageStart, endPx: currentPageEnd });
          }
          // Start new page with this block
          currentPageStart = block.top;
          currentPageEnd = block.bottom;
          
          // If single block is taller than a page, it gets its own page(s)
          if (block.bottom - block.top > pageHeightPx) {
            pages.push({ startPx: block.top, endPx: block.bottom });
            currentPageStart = block.bottom;
            currentPageEnd = block.bottom;
          }
        } else {
          // Block fits on current page
          currentPageEnd = block.bottom;
        }
      }
      // Flush last page
      if (currentPageEnd > currentPageStart) {
        pages.push({ startPx: currentPageStart, endPx: currentPageEnd });
      }

      // Render each page
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        
        const { startPx, endPx } = pages[i];
        const heightPx = (endPx - startPx) * scale;
        const heightPts = heightPx * pxToPoints;
        
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = fullCanvas.width;
        sliceCanvas.height = Math.ceil(heightPx);
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(fullCanvas, 0, -(startPx * scale));
        
        pdf.addImage(
          sliceCanvas.toDataURL('image/png'),
          'PNG', 0, 0, pageW, heightPts
        );
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
            return (
              <section key={`scope-${agent}`} className="space-y-8 break-before-page">
                {/* Intro + Highlights block */}
                <div data-pdf-block>
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

                {/* Service Categories — each card is a separate PDF block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {serviceContent.categories.map((category, index) => (
                    <div data-pdf-block key={index} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
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
                  <div className="break-before-page" data-pdf-block>
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