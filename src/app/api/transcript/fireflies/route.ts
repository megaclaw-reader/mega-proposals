import { NextRequest, NextResponse } from 'next/server';

const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY || '';
const FIREFLIES_GRAPHQL = 'https://api.fireflies.ai/graphql';

/**
 * Extract transcript ID from a Fireflies URL.
 * URLs look like: https://app.fireflies.ai/view/Some-Title-id01KPBTRF03VFXSTWX9JZ9902YK
 */
function extractTranscriptId(url: string): string | null {
  const match = url.match(/-id([A-Z0-9]+)$/i) || url.match(/id([A-Z0-9]{20,})$/i);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || !url.includes('fireflies.ai')) {
      return NextResponse.json({ error: 'Invalid Fireflies URL' }, { status: 400 });
    }

    if (!FIREFLIES_API_KEY) {
      return NextResponse.json({ error: 'Fireflies API key not configured' }, { status: 500 });
    }

    const transcriptId = extractTranscriptId(url);
    if (!transcriptId) {
      return NextResponse.json({ error: 'Could not extract transcript ID from URL' }, { status: 400 });
    }

    // Fetch transcript via GraphQL API
    const gqlRes = await fetch(FIREFLIES_GRAPHQL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIREFLIES_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query Transcript($id: String!) {
          transcript(id: $id) {
            title
            summary {
              overview
              shorthand_bullet
            }
            sentences {
              text
            }
          }
        }`,
        variables: { id: transcriptId },
      }),
    });

    if (!gqlRes.ok) {
      return NextResponse.json({ error: 'Fireflies API request failed' }, { status: 502 });
    }

    const gqlData = await gqlRes.json();
    const transcript = gqlData?.data?.transcript;

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    // Build transcript text: prefer summary, fall back to sentences
    let text = '';
    if (transcript.summary?.shorthand_bullet) {
      text = transcript.summary.shorthand_bullet;
    } else if (transcript.summary?.overview) {
      text = transcript.summary.overview;
    } else if (transcript.sentences?.length > 0) {
      text = transcript.sentences.map((s: { text: string }) => s.text).join(' ');
    }

    if (!text) {
      return NextResponse.json({ error: 'No transcript content found (may still be processing)' }, { status: 422 });
    }

    return NextResponse.json({ transcript: text, title: transcript.title });
  } catch (error) {
    console.error('Fireflies API error:', error);
    return NextResponse.json({ error: 'Internal error processing transcript' }, { status: 500 });
  }
}
