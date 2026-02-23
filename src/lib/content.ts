import { Agent, Template } from './types';

export interface ServiceContent {
  title: string;
  description: string;
  highlights: string[];
  categories: {
    name: string;
    items: string[];
  }[];
  timeline?: {
    phase: string;
    items: string[];
  }[];
}

export const SERVICE_DESCRIPTIONS = {
  seo: {
    title: "SEO & GEO Agent",
    shortDescription: "Dominate search results with AI-powered SEO and GEO strategies",
    badge: "SEO/GEO",
    color: "blue"
  },
  paid_ads: {
    title: "Paid Ads Agent",
    shortDescription: "Maximize ROI with intelligent paid advertising automation",
    badge: "PAID ADS",
    color: "blue"
  },
  website: {
    title: "Website Agent",
    shortDescription: "Custom AI-optimized websites built for conversion",
    badge: "WEB",
    color: "blue"
  }
};

export function getServiceScope(agent: Agent, template: Template): ServiceContent {
  switch (agent) {
    case 'seo':
      return {
        title: "SEO/GEO Agent Services Scope",
        description: "Our SEO/GEO Agent leverages cutting-edge AI technology to optimize your digital presence across search engines and local geo-locations. Through strategic content creation, technical optimization, and local search dominance, we drive qualified traffic and improve your online visibility where it matters most.",
        highlights: [
          "Dedicated Account Manager: You'll work one-on-one with a dedicated SEO/GEO Account Manager available for monthly strategy meetings to review performance, discuss goals, and align on priorities.",
          "Ongoing Optimization: This isn't a one-time setup. Our AI agents continuously monitor performance, update articles, and adapt to algorithm changes. We optimize content daily and adjust strategies based on search trends."
        ],
        categories: [
          {
            name: "SEO/GEO Strategy & Keyword Research",
            items: [
              "Comprehensive competitor analysis and gap identification",
              "High-value keyword research and opportunity mapping",
              "Local search optimization and geo-targeting strategy",
              "Content strategy development and editorial calendar planning"
            ]
          },
          {
            name: "Content Creation & Ongoing Optimization",
            items: [
              "20-25 SEO-optimized articles and pages per month",
              "Location-specific landing page development",
              "E-E-A-T content creation for authority building",
              "Regular content audits and metadata optimization",
              "Internal linking strategy implementation",
              "Content refresh and update programs"
            ]
          },
          {
            name: "Technical SEO/GEO & Continuous Monitoring",
            items: [
              "Comprehensive site audits and technical fixes",
              "Page speed optimization and Core Web Vitals",
              "Schema markup implementation and maintenance",
              "Mobile responsiveness and user experience optimization",
              "XML sitemap management and robots.txt optimization",
              "Google Search Console and Google My Business management"
            ]
          },
          {
            name: "LLM & AI Placement (GEO)",
            items: [
              "AI search optimization for ChatGPT, Claude, and emerging AI platforms",
              "Local AI search visibility enhancement",
              "Voice search optimization for local queries"
            ]
          },
          {
            name: "Link Building & Authority",
            items: [
              "High-quality backlink acquisition campaigns",
              "Local citation building and NAP consistency",
              "Industry partnership and collaboration outreach",
              "Digital PR and thought leadership positioning",
              "Link audit and toxic link disavowal"
            ]
          },
          {
            name: "Conversion Optimization",
            items: [
              "Landing page conversion rate optimization",
              "Local lead capture form optimization",
              "Call tracking and conversion attribution setup"
            ]
          }
        ],
        timeline: [
          {
            phase: "Day 0-30 (Foundation & Analysis)",
            items: [
              "Full site audit and technical SEO analysis",
              "Review and optimize sitemap & robots.txt",
              "Complete Google Search Console and Google My Business review",
              "Comprehensive competitor and keyword research",
              "Generate 20-25 SEO-optimized articles",
              "Content audit and metadata optimization",
              "Image SEO optimization and technical fixes",
              "Implement E-E-A-T best practices"
            ]
          },
          {
            phase: "Day 31-60 (Content & Growth)",
            items: [
              "Review 0-30 day performance data and insights",
              "Generate 20-25 additional SEO-optimized articles",
              "Update 5+ existing articles daily for freshness",
              "Program and launch location-based landing pages",
              "Optimize internal linking structure site-wide",
              "Weekly Google My Business posts and local SEO boost",
              "Add comprehensive schema markup implementation",
              "Page speed optimization and performance tuning"
            ]
          },
          {
            phase: "Day 61-90 (Scale & Authority)",
            items: [
              "Review 0-60 day comprehensive data analysis",
              "Generate 20-25 high-authority pages",
              "Rollout programmatic landing pages at scale",
              "Refresh and update older content for relevance",
              "Launch high-quality backlink acquisition campaigns",
              "Local citation building and directory submissions",
              "Conversion rate optimization review and implementation",
              "AI search crawlability and optimization setup"
            ]
          },
          {
            phase: "Ongoing (Month 4+)",
            items: [
              "Monthly comprehensive performance reviews",
              "Content expansion and topical authority building",
              "Continuous keyword opportunity mining",
              "Technical maintenance and optimization",
              "Competitive monitoring and strategy adjustments",
              "Quarterly strategy refinement and goal setting"
            ]
          }
        ]
      };

    case 'paid_ads':
      return template === 'leads' ? {
        title: "Paid Ads Agent Services Scope",
        description: "Our Paid Ads Agent leverages advanced AI technology to optimize your paid advertising campaigns across all major platforms. Through strategic campaign management, creative testing, and performance optimization, we drive high-quality leads and maximize your advertising ROI.",
        highlights: [
          "Dedicated Paid Ads Expert: You'll work one-on-one with a dedicated Paid Ads Expert and Account Manager available for monthly strategy meetings to review performance, discuss goals, and align on priorities.",
          "Optimized for CPQL, Not Just CPL: We don't just chase cheap leads. Our AI optimizes for Cost Per Qualified Lead (CPQL)—focusing your budget on the leads that actually convert into revenue, not just form fills.",
          "Ongoing Optimization: This isn't a one-time setup. Our AI agents continuously monitor performance, analyze data, and optimize your campaigns daily. We adjust budgets, refresh creatives, and adapt to market changes."
        ],
        categories: [
          {
            name: "Strategic Direction",
            items: [
              "Business goal review and alignment",
              "Channel selection and prioritization",
              "Audience research and segmentation",
              "Budget allocation and optimization",
              "Offer strategy development and testing"
            ]
          },
          {
            name: "Implementation Solutions",
            items: [
              "Pixel setup and quality assurance",
              "Google Tag Manager implementation",
              "Conversion tracking and attribution",
              "Event mapping and custom audiences",
              "CRM integration and lead scoring"
            ]
          },
          {
            name: "Creative",
            items: [
              "Hook and headline testing strategies",
              "Image and basic video creative development",
              "Creative refresh cycles and rotation",
              "Ad variant testing and optimization",
              "Platform-native format adaptation"
            ]
          },
          {
            name: "Campaign Management",
            items: [
              "Ad account setup and configuration",
              "Campaign launches and monitoring",
              "Ad scheduling and budget management",
              "Naming conventions and organization",
              "Live issue monitoring and resolution"
            ]
          },
          {
            name: "Performance Optimization",
            items: [
              "Budget reallocation based on performance",
              "Creative rotation and testing cycles",
              "Audience pruning and refinement",
              "Bid strategy tuning and optimization",
              "A/B testing implementation and analysis"
            ]
          },
          {
            name: "Reporting & Insights",
            items: [
              "Weekly performance reporting and analysis",
              "Channel comparison and optimization",
              "Top performing ad identification",
              "Goal tracking and ROI measurement",
              "Strategic recommendations and planning"
            ]
          }
        ],
        timeline: [
          {
            phase: "Day 0-30 (Foundation & Quick Wins)",
            items: [
              "Comprehensive onboarding meeting and goal setting",
              "Full audit of past ad performance and learnings",
              "Re-instrument website with proper pixel implementation",
              "CRM integration and lead tracking setup",
              "Develop comprehensive advertising strategy",
              "Begin incrementally testing branded search campaigns",
              "Identify and reduce current spend inefficiencies",
              "Launch first round of creative testing",
              "Implement initial landing page A/B testing"
            ]
          },
          {
            phase: "Day 32-60 (Content & Optimization Engine)",
            items: [
              "Execute rapid iterations of creative testing",
              "Optimize channel performance with retargeting and remarketing",
              "Refine keyword targeting and negative keyword implementation",
              "Continue landing page refinement and testing",
              "Implement advanced bidding strategy refinements"
            ]
          },
          {
            phase: "Day 61-90 (Scale & Compound)",
            items: [
              "Maintain rapid iteration cycles for continuous improvement",
              "Deploy complex audience segmentation strategies",
              "Implement multi-approach bidding strategies",
              "Launch fully robust lead scoring and lead quality solutions"
            ]
          }
        ]
      } : {
        title: "Paid Ads Agent Services Scope",
        description: "Our Paid Ads Agent leverages advanced AI technology to optimize your eCommerce advertising campaigns across all major platforms. Through strategic campaign management, product-focused creative testing, and revenue optimization, we drive profitable sales and maximize your return on ad spend.",
        highlights: [
          "Dedicated Paid Ads Expert: You'll work one-on-one with a dedicated Paid Ads Expert and Account Manager available for monthly strategy meetings to review performance, discuss goals, and align on priorities.",
          "Optimized for ROAS & CAC: We don't just chase clicks. Our AI optimizes for Return on Ad Spend (ROAS) and Customer Acquisition Cost (CAC)—focusing your budget on driving profitable revenue, not just traffic.",
          "Ongoing Optimization: This isn't a one-time setup. Our AI agents continuously monitor performance, analyze data, and optimize your campaigns daily. We adjust budgets, refresh creatives, and adapt to market changes."
        ],
        categories: [
          {
            name: "Strategic Direction",
            items: [
              "Revenue goal setting and ROAS target alignment",
              "Channel selection based on CAC optimization",
              "Product catalog analysis and prioritization",
              "Budget allocation for maximum profitability",
              "Offer strategy and promotional campaign development"
            ]
          },
          {
            name: "Implementation Solutions",
            items: [
              "Purchase event tracking and revenue attribution",
              "Product feed setup and optimization",
              "Cart abandonment tracking and retargeting",
              "Dynamic product ads implementation",
              "Customer lifetime value optimization"
            ]
          },
          {
            name: "Creative",
            items: [
              "Product-focused creative asset development",
              "User-generated content style advertisements",
              "Shopping ad format optimization",
              "Dynamic creative testing for products",
              "Seasonal and promotional creative campaigns"
            ]
          },
          {
            name: "Campaign Management",
            items: [
              "Prospecting campaign setup and scaling",
              "Retargeting campaign optimization",
              "Shopping campaign management and bidding",
              "Brand awareness and consideration campaigns",
              "Cross-platform campaign coordination"
            ]
          },
          {
            name: "Performance Optimization",
            items: [
              "Focus budget on highest-ROAS campaigns",
              "Optimize for target ROAS and CAC thresholds",
              "Revenue lift testing and implementation",
              "Product performance analysis and optimization",
              "Customer journey optimization across touchpoints"
            ]
          },
          {
            name: "Reporting & Insights",
            items: [
              "ROAS and CAC performance tracking",
              "Revenue attribution and customer journey analysis",
              "Product performance insights and recommendations",
              "Customer lifetime value reporting",
              "Profitability analysis and strategic recommendations"
            ]
          }
        ],
        timeline: [
          {
            phase: "Day 0-30 (Foundation & Quick Wins)",
            items: [
              "Comprehensive onboarding meeting and revenue goal alignment",
              "Full audit of past ad performance and eCommerce metrics",
              "Product feed setup and catalog optimization",
              "Purchase tracking implementation and testing",
              "Launch Shopping campaigns and dynamic ads",
              "Begin incrementally testing branded search campaigns",
              "Identify and reduce current spend inefficiencies",
              "Launch first round of product-focused creative testing",
              "Implement initial product page A/B testing"
            ]
          },
          {
            phase: "Day 32-60 (Creative & Optimization Engine)",
            items: [
              "Execute cart abandonment retargeting campaigns",
              "Optimize Shopping and Search keyword targeting",
              "Continue product page refinement and testing",
              "Implement ROAS and CAC-focused bidding strategies"
            ]
          },
          {
            phase: "Day 61-90 (Scale & Compound)",
            items: [
              "Deploy lookalike audience scaling strategies",
              "Implement advanced ROAS-optimized bidding",
              "Launch comprehensive revenue attribution modeling"
            ]
          }
        ]
      };

    case 'website':
      return {
        title: "Website Agent Services Scope",
        description: "Our Website Agent delivers professional, AI-optimized websites designed for maximum conversion and seamless integration with your marketing ecosystem. From custom development to ongoing maintenance, we ensure your digital presence drives results.",
        highlights: [
          "Dedicated Web Expert: You'll work one-on-one with a dedicated Web Development Expert who understands your business goals and technical requirements.",
          "Dedicated Account Manager: Unlimited ongoing changes with 2 business-day turnaround. Need updates, new pages, or design tweaks? We've got you covered."
        ],
        categories: [
          {
            name: "Full Site Development",
            items: [
              "Custom website design and development",
              "Mobile-responsive design optimization",
              "User experience (UX) optimization"
            ]
          },
          {
            name: "SEO & Ads Ready",
            items: [
              "SEO-optimized site architecture and URL structure",
              "Ad tracking pixel implementation and testing",
              "Conversion tracking setup and configuration",
              "Meta tags and schema markup optimization",
              "Site speed optimization for better rankings"
            ]
          },
          {
            name: "Analytics Dashboard",
            items: [
              "Google Analytics 4 setup and configuration",
              "Custom conversion goal tracking",
              "Performance monitoring dashboard setup"
            ]
          },
          {
            name: "Performance & Reliability",
            items: [
              "99.9% uptime guarantee with monitoring",
              "Fast loading speeds (Core Web Vitals optimization)",
              "CDN implementation for global performance",
              "Regular performance audits and optimization"
            ]
          },
          {
            name: "Content Generation",
            items: [
              "AI-powered content creation and optimization",
              "Blog setup and content management system",
              "Landing page development for campaigns"
            ]
          },
          {
            name: "Unlimited Changes",
            items: [
              "Design updates and modifications",
              "New page creation and content updates",
              "2 business-day turnaround guarantee"
            ]
          },
          {
            name: "Hosting & Infrastructure",
            items: [
              "Secure cloud hosting included",
              "SSL certificate and HTTPS implementation",
              "Daily backups and disaster recovery",
              "Domain management and DNS configuration"
            ]
          },
          {
            name: "Security & Compliance",
            items: [
              "GDPR compliance implementation",
              "Security monitoring and malware protection",
              "Regular security updates and patches",
              "Privacy policy and terms of service setup"
            ]
          }
        ]
      };

    default:
      throw new Error(`Unknown agent type: ${agent}`);
  }
}

export const EXECUTIVE_SUMMARY_CONTENT = {
  leads: "This Statement of Work outlines a comprehensive AI-driven marketing strategy designed to generate high-quality leads for your business. Our approach combines cutting-edge SEO/GEO optimization, intelligent paid advertising, and conversion-focused web development to create a powerful lead generation engine that delivers measurable results and sustainable growth.",
  ecom: "This Statement of Work presents a complete AI-powered eCommerce marketing solution designed to maximize your online revenue and customer acquisition. Through advanced SEO/GEO strategies, targeted paid advertising, and conversion-optimized web development, we'll create a comprehensive system that drives sales and builds lasting customer relationships."
};