import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { ProposalConfig } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'customerName',
      'companyName', 
      'template',
      'selectedAgents',
      'contractTerm',
      'salesRepName',
      'salesRepEmail'
    ];
    
    for (const field of requiredFields) {
      if (!body[field] || (Array.isArray(body[field]) && body[field].length === 0)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.salesRepEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate agents array
    const validAgents = ['seo', 'paid_ads', 'website'];
    if (!Array.isArray(body.selectedAgents) || 
        !body.selectedAgents.every((agent: string) => validAgents.includes(agent))) {
      return NextResponse.json(
        { error: 'Invalid agents selection' },
        { status: 400 }
      );
    }

    // Validate template
    if (!['leads', 'ecom'].includes(body.template)) {
      return NextResponse.json(
        { error: 'Invalid template type' },
        { status: 400 }
      );
    }

    // Validate contract term
    if (!['annual', 'bi_annual', 'quarterly', 'monthly'].includes(body.contractTerm)) {
      return NextResponse.json(
        { error: 'Invalid contract term' },
        { status: 400 }
      );
    }

    // Validate discount percentage
    if (body.discountPercentage !== undefined) {
      const discount = parseFloat(body.discountPercentage);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        return NextResponse.json(
          { error: 'Discount percentage must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    const proposalConfig: Omit<ProposalConfig, 'id' | 'createdAt'> = {
      customerName: body.customerName.trim(),
      companyName: body.companyName.trim(),
      template: body.template,
      selectedAgents: body.selectedAgents,
      contractTerm: body.contractTerm,
      discountPercentage: body.discountPercentage ? parseFloat(body.discountPercentage) : undefined,
      salesRepName: body.salesRepName.trim(),
      salesRepEmail: body.salesRepEmail.trim().toLowerCase(),
    };

    const proposalId = await db.createProposal(proposalConfig);

    return NextResponse.json({ id: proposalId }, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}