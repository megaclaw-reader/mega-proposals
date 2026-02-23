import { Agent, Template } from './types';

export interface ServiceContent {
  title: string;
  description: string;
  deliverables: string[];
}

export const SERVICE_DESCRIPTIONS = {
  seo: {
    title: "SEO & GEO Agent",
    shortDescription: "Dominate search results with AI-powered SEO and GEO strategies",
    description: "Our SEO & GEO Agent leverages cutting-edge AI technology to optimize your digital presence across search engines and local geo-locations, driving qualified traffic and improving your online visibility."
  },
  paid_ads: {
    title: "Paid Ads Agent", 
    shortDescription: "Maximize ROI with intelligent paid advertising automation",
    description: "AI-driven paid advertising campaigns designed to optimize performance and maximize your return on investment across all major platforms."
  },
  website: {
    title: "Website Agent",
    shortDescription: "Custom AI-optimized websites built for conversion",
    description: "Professional website development with AI optimization, designed for maximum conversion and seamless integration with your marketing ecosystem."
  }
};

export function getServiceScope(agent: Agent, template: Template): ServiceContent {
  switch (agent) {
    case 'seo':
      return {
        title: SERVICE_DESCRIPTIONS.seo.title,
        description: SERVICE_DESCRIPTIONS.seo.description,
        deliverables: [
          "20-25 SEO-optimized blog posts per month",
          "Comprehensive technical SEO audits",
          "AI LLM & GEO placement optimization",
          "Strategic link building campaigns",
          "Conversion rate optimization",
          "Local search optimization",
          "Keyword research and strategy",
          "Performance monitoring and reporting"
        ]
      };

    case 'paid_ads':
      return template === 'leads' ? {
        title: SERVICE_DESCRIPTIONS.paid_ads.title,
        description: SERVICE_DESCRIPTIONS.paid_ads.description,
        deliverables: [
          "CPQL (Cost Per Qualified Lead) optimization",
          "CRM integration and lead tracking",
          "Lead scoring and quality assessment solutions",
          "Landing page A/B testing and optimization",
          "Advanced retargeting and remarketing campaigns",
          "Multi-platform campaign management",
          "Real-time performance monitoring",
          "Monthly strategy reviews and optimizations"
        ]
      } : {
        title: SERVICE_DESCRIPTIONS.paid_ads.title,
        description: SERVICE_DESCRIPTIONS.paid_ads.description,
        deliverables: [
          "ROAS & CAC optimization strategies",
          "Product feed setup and catalog integration",
          "Shopping & Dynamic ads implementation",
          "Cart abandonment retargeting campaigns",
          "Purchase event tracking and optimization",
          "Multi-channel campaign coordination",
          "Revenue attribution modeling",
          "Monthly performance analysis and reporting"
        ]
      };

    case 'website':
      return {
        title: SERVICE_DESCRIPTIONS.website.title,
        description: SERVICE_DESCRIPTIONS.website.description,
        deliverables: [
          "Custom website design and development",
          "SEO & Ads ready setup and optimization",
          "Comprehensive analytics dashboard",
          "Unlimited changes with 2-day turnaround",
          "Secure hosting and SSL certification",
          "GDPR and compliance management",
          "Mobile-responsive design",
          "Performance optimization and monitoring"
        ]
      };

    default:
      throw new Error(`Unknown agent type: ${agent}`);
  }
}

export const EXECUTIVE_SUMMARY_CONTENT = {
  leads: "This proposal outlines a comprehensive AI-driven marketing strategy designed to generate high-quality leads for your business. Our approach combines cutting-edge SEO, intelligent paid advertising, and conversion optimization to create a powerful lead generation engine that delivers measurable results and sustainable growth.",
  ecom: "This proposal presents a complete AI-powered eCommerce marketing solution designed to maximize your online revenue and customer acquisition. Through advanced SEO strategies, targeted paid advertising, and conversion optimization, we'll create a comprehensive system that drives sales and builds lasting customer relationships."
};

export const IMPLEMENTATION_TIMELINE = {
  "Day 0-30": [
    "Initial account setup and configuration",
    "Comprehensive audit of current digital presence",
    "Strategic planning and goal setting",
    "Campaign architecture development",
    "Initial content creation and optimization"
  ],
  "Day 31-60": [
    "Full campaign launch and monitoring",
    "A/B testing implementation and analysis",
    "Performance optimization based on initial data",
    "Audience refinement and targeting adjustments",
    "First month performance review and strategy refinement"
  ],
  "Day 61-90": [
    "Advanced optimization and scaling strategies",
    "Custom automation implementation",
    "Performance benchmarking and goal assessment",
    "Quarterly strategy review and planning",
    "ROI analysis and future recommendations"
  ],
  "Ongoing": [
    "Continuous monitoring and optimization",
    "Monthly performance reviews and reports",
    "Proactive strategy adjustments",
    "New opportunity identification",
    "24/7 account management and support"
  ]
};