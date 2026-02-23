# MEGA AI Proposal Generator

A Next.js web application that enables sales representatives to create branded proposals for AI-powered marketing services.

## Features

- **Proposal Creator**: Interactive form for creating customized proposals
- **Professional Proposal View**: Clean, branded proposal display with MEGA branding
- **E-Signature Functionality**: DocuSign-level electronic signature capability
- **PDF Export**: Download proposals as PDF documents
- **Pricing Engine**: Automatic calculation based on selected services and terms
- **Template Support**: Leads-based and eCommerce-optimized templates

## Services Offered

- **SEO & GEO Agent**: AI-powered SEO and local optimization
- **Paid Ads Agent**: Intelligent paid advertising campaigns
- **Website Agent**: Custom website development and optimization

## Contract Terms

- Annual, Bi-Annual, Quarterly, Monthly billing options
- Combo pricing for SEO + Paid Ads packages
- Optional discount percentage support

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- SQLite database
- HTML2PDF for PDF generation
- Responsive design

## Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000 to access the proposal generator.

## Building

```bash
npm run build
npm start
```

## Deployment

Optimized for deployment on Render.com with:
- Static site generation where possible
- API routes for dynamic functionality
- SQLite database storage

## API Endpoints

- `POST /api/proposals` - Create a new proposal
- `GET /api/proposals/[id]` - Retrieve a proposal
- `POST /api/proposals/[id]/sign` - Sign a proposal electronically

## Database

Uses SQLite for simple, file-based storage:
- Proposals table for proposal configuration
- Signatures table for e-signature data with legal compliance tracking

## Legal Compliance

Electronic signatures capture:
- Full legal name and email
- IP address and timestamp
- User agent and agreement to terms
- Links to Terms of Use and Privacy Policy