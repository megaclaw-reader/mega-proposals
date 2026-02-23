'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Proposal, SignatureData } from '@/lib/types';
import { formatPrice, getTermDisplayName } from '@/lib/pricing';
import { getServiceScope, EXECUTIVE_SUMMARY_CONTENT, IMPLEMENTATION_TIMELINE, SERVICE_DESCRIPTIONS } from '@/lib/content';
import { format } from 'date-fns';

export default function ProposalPage() {
  const params = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatureForm, setSignatureForm] = useState({
    fullName: '',
    email: '',
    agreedToTerms: false
  });
  const proposalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProposal();
  }, [params.id]);

  const fetchProposal = async () => {
    try {
      const response = await fetch(`/api/proposals/${params.id}`);
      if (!response.ok) {
        throw new Error('Proposal not found');
      }
      const proposalData = await response.json();
      setProposal(proposalData);
    } catch (error) {
      console.error('Error fetching proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigning(true);

    try {
      const response = await fetch(`/api/proposals/${params.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signatureForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sign proposal');
      }

      // Refresh proposal to show signed state
      await fetchProposal();
      alert('Proposal signed successfully!');
    } catch (error: any) {
      console.error('Error signing proposal:', error);
      alert(`Error signing proposal: ${error.message}`);
    } finally {
      setSigning(false);
    }
  };

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
              <h1 className="text-4xl font-bold text-blue-600 mb-2">Mega</h1>
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

          {/* Select Your Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proposal.selectedAgents.map((agent) => {
                const serviceContent = getServiceScope(agent, proposal.template);
                return (
                  <div key={agent} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-semibold text-blue-600 mb-3">
                      {serviceContent.title}
                    </h3>
                    <p className="text-gray-700 mb-4">
                      {SERVICE_DESCRIPTIONS[agent].shortDescription}
                    </p>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(proposal.pricing.agents.find(a => 
                          a.agent === agent || (agent === 'seo' && a.agent === 'seo_paid_combo') || 
                          (agent === 'paid_ads' && a.agent === 'seo_paid_combo')
                        )?.finalPrice || 0)}
                      </span>
                      <span className="text-gray-600 text-sm block">
                        per {getTermDisplayName(proposal.contractTerm).toLowerCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
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
                            {formatPrice(agent.basePrice)}
                          </span>
                          <div className="text-2xl font-bold text-green-600">
                            {formatPrice(agent.finalPrice)}
                          </div>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(agent.finalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="bg-white rounded-lg p-6 border border-blue-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Total Investment</h3>
                      <p className="text-gray-600">{getTermDisplayName(proposal.contractTerm)} commitment</p>
                      {proposal.pricing.discountAmount > 0 && (
                        <p className="text-green-600 font-semibold">
                          Savings: {formatPrice(proposal.pricing.discountAmount)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {formatPrice(proposal.pricing.total)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* E-Signature Block */}
          {proposal.signature ? (
            /* Signed Confirmation */
            <section className="bg-green-50 border border-green-200 rounded-lg p-8">
              <div className="text-center mb-6">
                <div className="text-green-600 text-6xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">Proposal Signed</h2>
                <p className="text-green-700">This proposal has been legally executed and is now binding.</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Signature Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Signed by:</strong> {proposal.signature.fullName}</p>
                    <p><strong>Email:</strong> {proposal.signature.email}</p>
                    <p><strong>Date & Time:</strong> {format(new Date(proposal.signature.signedAt), 'MMMM dd, yyyy \'at\' h:mm a')}</p>
                  </div>
                  <div>
                    <p><strong>IP Address:</strong> {proposal.signature.ipAddress}</p>
                    <p><strong>Terms Agreed:</strong> Yes</p>
                    <p><strong>Document Locked:</strong> Yes</p>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            /* Signature Form */
            <section className="bg-gray-50 rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Electronic Signature</h2>
              <p className="text-gray-700 mb-6">
                By signing below, you agree to the terms and conditions outlined in this proposal.
                This constitutes a legally binding agreement.
              </p>
              
              <form onSubmit={handleSign} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={signatureForm.fullName}
                      onChange={(e) => setSignatureForm(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full legal name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={signatureForm.email}
                      onChange={(e) => setSignatureForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="text"
                    disabled
                    value={format(new Date(), 'MMMM dd, yyyy')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={signatureForm.agreedToTerms}
                    onChange={(e) => setSignatureForm(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                    className="mt-1 mr-3 text-blue-600"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to MEGA's{' '}
                    <a 
                      href="https://www.gomega.ai/legal/terms-of-use" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Terms of Use
                    </a>
                    {' '}and{' '}
                    <a 
                      href="https://www.gomega.ai/legal/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Legal Notice</h4>
                  <p className="text-sm text-gray-600">
                    By clicking "Sign & Accept Proposal" below, you are creating an electronic signature 
                    that has the same legal force and effect as a handwritten signature. This proposal 
                    will become a legally binding contract upon acceptance.
                  </p>
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={signing || !signatureForm.agreedToTerms}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors min-w-[200px]"
                  >
                    {signing ? 'Processing...' : 'Sign & Accept Proposal'}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}