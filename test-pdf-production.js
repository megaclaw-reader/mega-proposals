// Test script to generate PRODUCTION URLs for all 7 agent combinations
const configs = [
  // 1. SEO only
  {
    cn: 'Test Customer',
    co: 'Test Company',
    t: 'leads',
    a: ['seo'],
    st: [{ t: 'annual', d: 0 }, { t: 'bi_annual', d: 0 }, { t: 'quarterly', d: 0 }],
    sr: 'Test Rep',
    se: 'test@example.com',
    ts: Date.now()
  },
  // 2. Paid Ads only
  {
    cn: 'Test Customer',
    co: 'Test Company', 
    t: 'leads',
    a: ['paid_ads'],
    st: [{ t: 'annual', d: 0 }, { t: 'bi_annual', d: 0 }, { t: 'quarterly', d: 0 }],
    sr: 'Test Rep',
    se: 'test@example.com',
    ts: Date.now()
  },
  // 3. Website only
  {
    cn: 'Test Customer',
    co: 'Test Company',
    t: 'leads', 
    a: ['website'],
    st: [{ t: 'annual', d: 0 }, { t: 'bi_annual', d: 0 }, { t: 'quarterly', d: 0 }],
    sr: 'Test Rep',
    se: 'test@example.com',
    ts: Date.now()
  },
  // 4. SEO + Paid Ads
  {
    cn: 'Test Customer',
    co: 'Test Company',
    t: 'leads',
    a: ['seo', 'paid_ads'],
    st: [{ t: 'annual', d: 0 }, { t: 'bi_annual', d: 0 }, { t: 'quarterly', d: 0 }],
    sr: 'Test Rep',
    se: 'test@example.com',
    ts: Date.now()
  },
  // 5. SEO + Website
  {
    cn: 'Test Customer',
    co: 'Test Company',
    t: 'leads',
    a: ['seo', 'website'],
    st: [{ t: 'annual', d: 0 }, { t: 'bi_annual', d: 0 }, { t: 'quarterly', d: 0 }],
    sr: 'Test Rep',
    se: 'test@example.com',
    ts: Date.now()
  },
  // 6. Paid Ads + Website
  {
    cn: 'Test Customer',
    co: 'Test Company',
    t: 'leads',
    a: ['paid_ads', 'website'],
    st: [{ t: 'annual', d: 0 }, { t: 'bi_annual', d: 0 }, { t: 'quarterly', d: 0 }],
    sr: 'Test Rep', 
    se: 'test@example.com',
    ts: Date.now()
  },
  // 7. SEO + Paid Ads + Website
  {
    cn: 'Test Customer',
    co: 'Test Company',
    t: 'leads',
    a: ['seo', 'paid_ads', 'website'],
    st: [{ t: 'annual', d: 0 }, { t: 'bi_annual', d: 0 }, { t: 'quarterly', d: 0 }],
    sr: 'Test Rep',
    se: 'test@example.com',
    ts: Date.now()
  }
];

console.log('PRODUCTION Test URLs for all 7 agent combinations:\n');

configs.forEach(config => {
  const enc = Buffer.from(JSON.stringify(config)).toString('base64url');
  const agentNames = config.a.join(' + ');
  console.log(`${agentNames}: https://mega-proposals.vercel.app/proposal/${enc}`);
});

console.log('\n✅ Instructions:');
console.log('1. Visit each URL above');
console.log('2. Click "Download PDF" button');
console.log('3. Verify no content is split between pages');
console.log('4. Check that blocks are properly grouped:');
console.log('   - Header block');
console.log('   - Executive Summary block');
console.log('   - Your Services block');
console.log('   - Each agent: intro+highlights block (starts new page)');
console.log('   - Each agent: category cards in pairs (2 per block)');
console.log('   - Each agent: implementation timeline block (starts new page)');
console.log('   - Investment Summary block (starts new page)');
console.log('\n🔍 What to look for:');
console.log('- NO cards cut in half between pages');
console.log('- NO headings orphaned at bottom of pages');
console.log('- Clean page breaks at logical boundaries');
console.log('- Professional appearance suitable for client delivery');