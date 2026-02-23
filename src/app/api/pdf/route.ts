import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const chromium = await import('@sparticuz/chromium-min');
    const puppeteer = await import('puppeteer-core');

    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: { width: 816, height: 1056 },
      executablePath: await chromium.default.executablePath(
        'https://github.com/nichochar/chromium-brotli-lambda-arm64/releases/download/v131.0.0/chromium-v131.0.0-pack.tar'
      ),
      headless: true,
    });

    const page = await browser.newPage();
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });

    // Hide the action bar
    await page.evaluate(() => {
      const els = document.querySelectorAll('.print\\:hidden');
      els.forEach(el => (el as HTMLElement).style.display = 'none');
      // Remove max-width constraint for proper PDF rendering
      const main = document.querySelector('.max-w-6xl');
      if (main) {
        (main as HTMLElement).style.maxWidth = 'none';
      }
    });

    await page.evaluate(() => document.fonts.ready);

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="MEGA_SOW.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'PDF generation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
