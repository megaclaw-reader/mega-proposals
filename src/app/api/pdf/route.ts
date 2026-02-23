import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Dynamic imports for serverless
    const chromium = await import('@sparticuz/chromium');
    const puppeteer = await import('puppeteer-core');

    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: { width: 816, height: 1056 }, // Letter size at 96dpi
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    
    // Navigate to the proposal page
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Hide the action bar
    await page.evaluate(() => {
      const actionBar = document.querySelector('.print\\:hidden');
      if (actionBar) (actionBar as HTMLElement).style.display = 'none';
    });

    // Wait for fonts and images to load
    await page.evaluate(() => document.fonts.ready);

    // Generate PDF with proper page breaks
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.25in', bottom: '0.25in', left: '0.25in', right: '0.25in' },
      preferCSSPageSize: false,
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
