// Test script to generate URLs for all 7 agent combinations
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

console.log('Test URLs for all 7 agent combinations:\n');

configs.forEach(config => {
  const enc = Buffer.from(JSON.stringify(config)).toString('base64url');
  const agentNames = config.a.join(' + ');
  console.log(`${agentNames}: http://localhost:3001/proposal/${enc}`);
});

console.log('\nInstructions:');
console.log('1. Run: cd /Users/junehamilton/.openclaw/workspace/mega-proposals');
console.log('2. Run: npx next dev -p 3001');
console.log('3. Visit each URL and test PDF download');
console.log('4. Verify no content is split between pages');