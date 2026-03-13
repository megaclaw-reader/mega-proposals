import { Agent, PersonalizedContent } from './types';

/**
 * Fetch transcript text from a Fireflies URL.
 * The __NEXT_DATA__ JSON on public Fireflies pages contains
 * summaryMeetingNoteComment.comment with the full AI summary.
 */
export async function fetchFirefliesTranscript(url: string): Promise<string> {
  const res = await fetch('/api/transcript/fireflies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error('Failed to fetch Fireflies transcript');
  const data = await res.json();
  return data.transcript;
}

// ── Keyword-based agent classification ──

const AGENT_KEYWORDS: Record<Agent, string[]> = {
  seo: [
    'seo', 'search engine', 'organic', 'ranking', 'rank', 'google',
    'keywords', 'keyword', 'backlink', 'backlinks', 'serp', 'indexing',
    'meta tag', 'meta description', 'title tag', 'on-page', 'off-page',
    'domain authority', 'search visibility', 'organic traffic',
    'content marketing', 'blog', 'long-tail', 'geo', 'local seo',
    'google business', 'map pack', 'citation', 'search console',
    'crawl', 'sitemap', 'schema', 'rich snippet', 'ai overview',
  ],
  paid_ads: [
    'paid ads', 'ppc', 'google ads', 'facebook ads', 'meta ads',
    'ad spend', 'cost per click', 'cpc', 'cpm', 'roas', 'roi',
    'campaign', 'retargeting', 'remarketing', 'conversion rate',
    'lead gen', 'leads', 'cost per lead', 'cpl', 'ad copy',
    'landing page', 'quality score', 'bidding', 'display ads',
    'social ads', 'instagram ads', 'tiktok ads', 'youtube ads',
    'paid search', 'paid media', 'ad budget', 'spend',
    'more leads', 'generate leads', 'lead generation',
  ],
  website: [
    'website', 'web design', 'redesign', 'site speed', 'page speed',
    'mobile', 'responsive', 'ux', 'ui', 'user experience',
    'conversion', 'landing page', 'bounce rate', 'load time',
    'wordpress', 'shopify', 'cms', 'hosting', 'ssl',
    'slow site', 'slow website', 'outdated', 'rebrand',
    'web development', 'frontend', 'accessibility',
  ],
};

const GENERAL_KEYWORDS = [
  'grow online', 'digital presence', 'online presence', 'digital marketing',
  'brand awareness', 'revenue', 'sales', 'grow', 'scale', 'competition',
  'competitors', 'market share', 'customers', 'online',
];

interface ChallengeMatch {
  agent: Agent | 'general';
  challenge: string;
  megaSolution: string;
}

const MEGA_SOLUTIONS: Record<Agent, string[]> = {
  seo: [
    'Our SEO & GEO Agent uses AI-powered optimization to improve your search rankings and organic visibility around the clock.',
    'MEGA\'s proprietary AI continuously monitors search trends and optimizes your content strategy for maximum organic growth.',
    'Our dedicated SEO team paired with AI agents ensures your site stays ahead of algorithm changes and competitor movements.',
  ],
  paid_ads: [
    'Our Paid Ads Agent leverages AI to optimize your ad spend, targeting, and bidding strategies for maximum ROI.',
    'MEGA\'s AI-driven campaign management continuously tests and optimizes ad creative, audiences, and budgets to reduce cost per lead.',
    'Our dedicated ads specialists combined with AI automation ensure every dollar of your ad budget drives qualified leads.',
  ],
  website: [
    'Our Website Agent delivers a high-converting, fast, mobile-optimized site built to turn visitors into customers.',
    'MEGA\'s web team creates conversion-focused designs backed by data, ensuring your website works as your best salesperson.',
    'Our AI-enhanced web development ensures your site loads fast, ranks well, and converts visitors at every touchpoint.',
  ],
};

const GENERAL_SOLUTIONS = [
  'MEGA\'s integrated approach combines AI technology with dedicated specialists to drive measurable business growth.',
  'Our full-service digital strategy ensures all channels work together to maximize your online impact and revenue.',
];

/**
 * Classify a sentence to the most relevant agent type.
 */
function classifySentence(sentence: string): Agent | 'general' | null {
  const lower = sentence.toLowerCase();
  const scores: Record<string, number> = { seo: 0, paid_ads: 0, website: 0, general: 0 };

  for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[agent]++;
    }
  }
  for (const kw of GENERAL_KEYWORDS) {
    if (lower.includes(kw)) scores.general++;
  }

  const max = Math.max(...Object.values(scores));
  if (max === 0) return null;

  const topAgent = Object.entries(scores).find(([, v]) => v === max)?.[0];
  return (topAgent as Agent | 'general') || null;
}

/**
 * Extract challenges from transcript sentences.
 * Looks for sentences with challenge/problem indicators.
 */
const CHALLENGE_INDICATORS = [
  'struggle', 'struggling', 'challenge', 'challenging', 'problem', 'issue',
  'difficult', 'hard to', 'not getting', 'don\'t rank', 'don\'t show',
  'losing', 'low', 'poor', 'bad', 'slow', 'expensive', 'costly',
  'need', 'want', 'looking for', 'trying to', 'have to', 'must',
  'can\'t', 'cannot', 'aren\'t', 'isn\'t', 'don\'t have', 'no ',
  'lack', 'missing', 'behind', 'falling', 'decline', 'dropping',
  'frustrated', 'concerned', 'worried', 'not enough', 'too much',
  'help with', 'improve', 'increase', 'boost', 'fix', 'solve',
];

const GOAL_INDICATORS = [
  'goal', 'target', 'want to', 'aiming', 'aim to', 'hope to',
  'plan to', 'looking to', 'need to', 'trying to reach',
  'objective', 'milestone', 'by end of', 'within', 'percent',
  '%', 'increase by', 'grow by', 'double', 'triple', 'x more',
  'kpi', 'metric', 'revenue goal', 'leads per', 'per month',
];

/**
 * Extract personalized content from transcript text, filtered by selected agents.
 */
export function extractFromTranscript(
  text: string,
  selectedAgents: Agent[]
): PersonalizedContent {
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const challenges: ChallengeMatch[] = [];
  const goals: string[] = [];
  let situationParts: string[] = [];
  const usedSolutions: Record<string, number> = {};

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();

    // Check for goals
    const isGoal = GOAL_INDICATORS.some(ind => lower.includes(ind));
    if (isGoal) {
      const agent = classifySentence(sentence);
      // Only include goals relevant to selected agents or general
      if (agent === null || agent === 'general' || selectedAgents.includes(agent as Agent)) {
        const cleaned = sentence.replace(/^[-•*]\s*/, '').trim();
        if (cleaned.length > 20 && cleaned.length < 300) {
          goals.push(cleaned);
        }
      }
    }

    // Check for challenges
    const isChallenge = CHALLENGE_INDICATORS.some(ind => lower.includes(ind));
    if (isChallenge) {
      const agent = classifySentence(sentence);
      if (agent === null) continue;

      // Filter: only include if agent matches selected agents or is general
      if (agent !== 'general' && !selectedAgents.includes(agent as Agent)) continue;

      const solutionAgent = agent === 'general' ? 'general' : agent;
      const solutionPool = agent === 'general' ? GENERAL_SOLUTIONS : MEGA_SOLUTIONS[agent as Agent];
      const idx = (usedSolutions[solutionAgent] || 0) % solutionPool.length;
      usedSolutions[solutionAgent] = idx + 1;

      const cleaned = sentence.replace(/^[-•*]\s*/, '').trim();
      if (cleaned.length > 15 && cleaned.length < 300) {
        challenges.push({
          agent: agent as Agent | 'general',
          challenge: cleaned,
          megaSolution: solutionPool[idx],
        });
      }
    }
  }

  // Try to extract company situation from first few sentences
  const firstSentences = sentences.slice(0, 8);
  for (const sentence of firstSentences) {
    const lower = sentence.toLowerCase();
    const isSituation = ['company', 'business', 'founded', 'based in', 'industry',
      'specializ', 'provide', 'offer', 'been in', 'years', 'team of',
      'currently', 'right now', 'at the moment'].some(kw => lower.includes(kw));
    if (isSituation) {
      situationParts.push(sentence.replace(/^[-•*]\s*/, '').trim());
    }
  }

  // Deduplicate challenges (similar content)
  const uniqueChallenges = challenges.reduce((acc, ch) => {
    const isDuplicate = acc.some(existing =>
      existing.challenge.toLowerCase().includes(ch.challenge.toLowerCase().slice(0, 30)) ||
      ch.challenge.toLowerCase().includes(existing.challenge.toLowerCase().slice(0, 30))
    );
    if (!isDuplicate) acc.push(ch);
    return acc;
  }, [] as ChallengeMatch[]);

  return {
    companySituation: situationParts.length > 0 ? situationParts.slice(0, 3).join(' ') : undefined,
    keyChallenges: uniqueChallenges.slice(0, 6), // Cap at 6 challenges
    specificGoals: goals.length > 0 ? [...new Set(goals)].slice(0, 5) : undefined,
  };
}
