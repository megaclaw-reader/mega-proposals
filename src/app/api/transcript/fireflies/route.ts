import { NextRequest, NextResponse } from 'next/server';

const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY || '';
const FIREFLIES_GRAPHQL = 'https://api.fireflies.ai/graphql';

/**
 * Extract transcript ID from a Fireflies URL.
 * Handles multiple URL formats:
 *   https://app.fireflies.ai/view/Some-Title-id01KPBTRF03VFXSTWX9JZ9902YK
 *   https://app.fireflies.ai/view/01KPBTRF03VFXSTWX9JZ9902YK
 *   https://app.fireflies.ai/notepad/01KPBTRF03VFXSTWX9JZ9902YK
 */
function extractTranscriptId(url: string): string | null {
  // Format: ...-id<ID> or ...::<ID> at end of path
  const idMatch = url.match(/(?:-id|::)([A-Z0-9]{20,})(?:[?#]|$)/i) || url.match(/id([A-Z0-9]{20,})$/i);
  if (idMatch) return idMatch[1];

  // Format: .../view/<ID> or .../notepad/<ID> (bare ID as last path segment)
  const pathMatch = url.match(/(?:view|notepad)\/([A-Z0-9]{20,})(?:[?#]|$)/i);
  if (pathMatch) return pathMatch[1];

  return null;
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

    // Build transcript text: combine overview + shorthand for best extraction
    const parts: string[] = [];
    if (transcript.summary?.overview) {
      parts.push(transcript.summary.overview);
    }
    if (transcript.summary?.shorthand_bullet) {
      parts.push(transcript.summary.shorthand_bullet);
    }
    if (parts.length === 0 && transcript.sentences?.length > 1) {
      // Use raw sentences if summary not available
      parts.push(transcript.sentences.map((s: { text: string }) => s.text).join(' '));
    }

    // If GraphQL returned nothing, try web scraping the public page
    if (parts.length === 0) {
      try {
        const pageRes = await fetch(`https://app.fireflies.ai/view/${transcriptId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const nextDataMatch = html.match(/__NEXT_DATA__.*?>(.*?)<\/script>/);
          if (nextDataMatch) {
            const pageData = JSON.parse(nextDataMatch[1]);
            const pageProps = pageData?.props?.pageProps || {};
            
            // Try summaryMeetingNoteComment first (richest content)
            const summaryComment = pageProps.summaryMeetingNoteComment?.comment;
            if (summaryComment) {
              parts.push(summaryComment);
            }
            
            // Also check for inline summary gist
            const gist = pageProps.initialMeetingNote?.summary?.gist;
            if (gist && !summaryComment) {
              parts.push(gist);
            }
          }
        }
      } catch (scrapeErr) {
        console.error('Fireflies page scrape fallback failed:', scrapeErr);
      }
    }

    const text = parts.join('\n\n');
    if (!text) {
      return NextResponse.json({ error: 'No transcript content found (may still be processing)' }, { status: 422 });
    }

    return NextResponse.json({ transcript: text, title: transcript.title });
  } catch (error) {
    console.error('Fireflies API error:', error);
    return NextResponse.json({ error: 'Internal error processing transcript' }, { status: 500 });
  }
}
