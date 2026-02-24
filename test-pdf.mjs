import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:3002/proposal/eyJjbiI6IkphY29iIEZveCIsImNvIjoiQ29iYWx0IiwidCI6ImxlYWRzIiwiYSI6WyJzZW8iLCJwYWlkX2FkcyIsIndlYnNpdGUiXSwic3QiOlt7InQiOiJhbm51YWwiLCJkIjowfSx7InQiOiJiaV9hbm51YWwiLCJkIjowfSx7InQiOiJxdWFydGVybHkiLCJkIjowfV0sInNyIjoiSnVsaWVuIENvbWl0byIsInNlIjoianVsaWVuY29taXRvQGdvbWVnYS5haSIsInRzIjoxNzcxOTQ1NDE5ODczfQ';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 900 });

console.log('Navigating to', url);
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// Wait for content to render
await new Promise(r => setTimeout(r, 2000));

// Hide action bar
await page.evaluate(() => {
  document.querySelectorAll('.print\\:hidden').forEach(el => el.style.display = 'none');
  // Remove max-width for full-width rendering
  const main = document.querySelector('.max-w-6xl');
  if (main) main.style.maxWidth = 'none';
});

// Generate a native browser PDF to see what it looks like
const pdf = await page.pdf({
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
});

const fs = await import('fs');
fs.writeFileSync('/tmp/mega-proposal-test.pdf', pdf);
console.log('PDF saved to /tmp/mega-proposal-test.pdf');
console.log('PDF size:', pdf.length, 'bytes');

// Now also click the Download PDF button and capture the client-side generated one
// First set up download handling
const client = await page.createCDPSession();
await client.send('Page.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: '/tmp/mega-downloads',
});

// Make action bar visible again
await page.evaluate(() => {
  document.querySelectorAll('.print\\:hidden').forEach(el => el.style.display = '');
  const main = document.querySelector('.max-w-6xl');
  if (main) main.style.maxWidth = '';
});

// Click download
console.log('Clicking Download PDF...');
await page.click('button:has-text("Download PDF")').catch(() => {
  // Try alternative selector
  return page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.includes('Download PDF')) {
        btn.click();
        return;
      }
    }
  });
});

// Wait for generation
console.log('Waiting for PDF generation...');
await new Promise(r => setTimeout(r, 60000));

// Check downloads
const files = fs.readdirSync('/tmp/mega-downloads').filter(f => f.endsWith('.pdf'));
console.log('Downloaded files:', files);

await browser.close();
