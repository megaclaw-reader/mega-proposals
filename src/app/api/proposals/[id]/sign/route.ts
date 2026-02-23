import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { SignatureData } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'agreedToTerms'];
    for (const field of requiredFields) {
      if (!body[field] || (field === 'agreedToTerms' && body[field] !== true)) {
        return NextResponse.json(
          { error: `Missing or invalid field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if proposal exists and is not already signed
    const existingProposal = await db.getProposal(id);
    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    if (existingProposal.signature) {
      return NextResponse.json(
        { error: 'Proposal has already been signed' },
        { status: 400 }
      );
    }

    // Get client IP address
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const signatureData: SignatureData = {
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      signedAt: new Date(),
      ipAddress: clientIP,
      userAgent: userAgent,
      agreedToTerms: true
    };

    await db.signProposal(id, signatureData, clientIP);

    return NextResponse.json({ 
      message: 'Proposal signed successfully',
      signatureData: {
        ...signatureData,
        ipAddress: clientIP,
        userAgent: userAgent
      }
    });
  } catch (error) {
    console.error('Error signing proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}