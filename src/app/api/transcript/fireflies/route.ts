import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || !url.includes('fireflies.ai')) {
      return NextResponse.json({ error: 'Invalid Fireflies URL' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch Fireflies page' }, { status: 502 });
    }

    const html = await res.text();

    // Extract __NEXT_DATA__ JSON
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) {
      return NextResponse.json({ error: 'Could not find transcript data on page' }, { status: 422 });
    }

    const data = JSON.parse(match[1]);

    // Navigate to the summary comment
    let transcript = '';
    try {
      const props = data.props?.pageProps;
      // Try multiple paths since Fireflies structure may vary
      transcript =
        props?.summaryMeetingNoteComment?.comment ||
        props?.transcript?.sentences?.map((s: { text: string }) => s.text).join(' ') ||
        props?.summary ||
        '';
    } catch {
      return NextResponse.json({ error: 'Could not extract transcript from page data' }, { status: 422 });
    }

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript content found' }, { status: 422 });
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error processing transcript' }, { status: 500 });
  }
}
