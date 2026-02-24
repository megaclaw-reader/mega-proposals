import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { ProposalPDF } from '@/components/ProposalPDF';
import { decodeProposal } from '@/lib/encode';
import { calculatePricing } from '@/lib/pricing';
import { Proposal } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const config = decodeProposal(id);
  if (!config) {
    return NextResponse.json({ error: 'Invalid proposal' }, { status: 400 });
  }

  const terms = config.selectedTerms && config.selectedTerms.length > 0
    ? config.selectedTerms
    : [{ term: config.contractTerm, discountPercentage: config.discountPercentage || 0 }];
  
  const pricing = calculatePricing(
    config.selectedAgents,
    terms[0].term,
    terms[0].discountPercentage,
  );

  const proposal: Proposal = { ...config, pricing };

  const buffer = await renderToBuffer(
    React.createElement(ProposalPDF, { proposal }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${config.companyName.replace(/\s+/g, '_')}_MEGA_SOW.pdf"`,
    },
  });
}
