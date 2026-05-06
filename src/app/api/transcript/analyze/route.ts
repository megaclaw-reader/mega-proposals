import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

interface AnalysisResult {
  companySituation?: string;
  keyChallenges: Array<{
    agent: string;
    challenge: string;
    megaSolution: string;
  }>;
  specificGoals?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, selectedAgents } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    const agentDescriptions: Record<string, string> = {
      seo: 'SEO & GEO Agent (search engine optimization, organic traffic, content, local search, AI search placement)',
      paid_ads: 'Paid Ads Agent (PPC, Google/Meta/social ads, ad spend optimization, ROAS, lead generation campaigns)',
      website: 'Website Agent (web design, development, conversion optimization, site speed, UX)',
      crm: 'CRM Agent (call handling, lead qualification, appointment booking, pipeline management, lead nurturing, follow-ups)',
    };

    const agentList = (selectedAgents as string[])
      .map(a => agentDescriptions[a] || a)
      .join('\n- ');

    // Truncate transcript to ~12K chars to stay within limits
    const trimmedTranscript = transcript.slice(0, 12000);

    const systemPrompt = `You are an expert at analyzing sales call transcripts for a digital marketing company called MEGA AI. Your job is to extract personalized content that will be used in a tailored proposal.

MEGA AI offers these agents (services):
- ${agentList}

Extract the following from the transcript and return ONLY valid JSON (no markdown, no code fences):

{
  "companySituation": "A 2-3 sentence summary of the prospect's company, industry, and current situation. Write this as if describing them to a colleague.",
  "keyChallenges": [
    {
      "agent": "seo|paid_ads|website|crm|general",
      "challenge": "A specific challenge or pain point the prospect mentioned",
      "megaSolution": "How MEGA's specific agent/service addresses this challenge. Be specific to MEGA's capabilities, not generic marketing advice."
    }
  ],
  "specificGoals": ["Specific business goals or targets the prospect mentioned"]
}

Rules:
- Only use agent values from the selected agents: ${(selectedAgents as string[]).join(', ')}. Use "general" for challenges that don't map to a specific agent.
- Extract 3-6 key challenges. Each should be a real pain point from the conversation, not generic.
- For megaSolution, reference MEGA's AI-powered approach and specific deliverables. Be confident but not hyperbolic.
- Extract 2-5 specific goals if mentioned.
- If the transcript is vague on challenges, infer reasonable ones from the context of the conversation.
- companySituation should feel natural and informed, like you actually listened to the call.
- Write from MEGA's perspective — you're creating content for a proposal to this prospect.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Here is the sales call transcript/notes:\n\n${trimmedTranscript}\n\nExtract the personalized proposal content as JSON.`,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Anthropic API error:', res.status, err);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    // Parse JSON from response (handle possible markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Anthropic response:', text.slice(0, 500));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const analysis: AnalysisResult = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Transcript analysis error:', error);
    return NextResponse.json({ error: 'Internal error analyzing transcript' }, { status: 500 });
  }
}
