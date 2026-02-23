import sqlite3 from 'sqlite3';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';
import { Proposal, ProposalConfig, SignatureData } from './types';
import { calculatePricing } from './pricing';

const DB_PATH = path.join(process.cwd(), 'data', 'proposals.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export class ProposalDatabase {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.serialize(() => {
      // Create proposals table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS proposals (
          id TEXT PRIMARY KEY,
          customer_name TEXT NOT NULL,
          company_name TEXT NOT NULL,
          template TEXT NOT NULL,
          selected_agents TEXT NOT NULL,
          contract_term TEXT NOT NULL,
          discount_percentage REAL,
          sales_rep_name TEXT NOT NULL,
          sales_rep_email TEXT NOT NULL,
          created_at TEXT NOT NULL,
          is_locked BOOLEAN DEFAULT 0
        )
      `);

      // Create signatures table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS signatures (
          proposal_id TEXT PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL,
          signed_at TEXT NOT NULL,
          ip_address TEXT NOT NULL,
          user_agent TEXT NOT NULL,
          agreed_to_terms BOOLEAN NOT NULL,
          FOREIGN KEY (proposal_id) REFERENCES proposals (id)
        )
      `);
    });
  }

  async createProposal(config: Omit<ProposalConfig, 'id' | 'createdAt'>): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = nanoid();
      const createdAt = new Date().toISOString();

      this.db.run(`
        INSERT INTO proposals (
          id, customer_name, company_name, template, selected_agents,
          contract_term, discount_percentage, sales_rep_name, sales_rep_email,
          created_at, is_locked
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        config.customerName,
        config.companyName,
        config.template,
        JSON.stringify(config.selectedAgents),
        config.contractTerm,
        config.discountPercentage || null,
        config.salesRepName,
        config.salesRepEmail,
        createdAt,
        0
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(id);
        }
      });
    });
  }

  async getProposal(id: string): Promise<Proposal | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          p.*,
          s.full_name as sig_full_name,
          s.email as sig_email,
          s.signed_at as sig_signed_at,
          s.ip_address as sig_ip_address,
          s.user_agent as sig_user_agent,
          s.agreed_to_terms as sig_agreed_to_terms
        FROM proposals p
        LEFT JOIN signatures s ON p.id = s.proposal_id
        WHERE p.id = ?
      `, [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          const config: ProposalConfig = {
            id: row.id,
            customerName: row.customer_name,
            companyName: row.company_name,
            template: row.template,
            selectedAgents: JSON.parse(row.selected_agents),
            contractTerm: row.contract_term,
            discountPercentage: row.discount_percentage,
            salesRepName: row.sales_rep_name,
            salesRepEmail: row.sales_rep_email,
            createdAt: new Date(row.created_at),
            isLocked: Boolean(row.is_locked)
          };

          const pricing = calculatePricing(
            config.selectedAgents,
            config.contractTerm,
            config.discountPercentage || 0
          );

          const proposal: Proposal = {
            ...config,
            pricing
          };

          // Add signature data if exists
          if (row.sig_full_name) {
            proposal.signature = {
              fullName: row.sig_full_name,
              email: row.sig_email,
              signedAt: new Date(row.sig_signed_at),
              ipAddress: row.sig_ip_address,
              userAgent: row.sig_user_agent,
              agreedToTerms: Boolean(row.sig_agreed_to_terms)
            };
          }

          resolve(proposal);
        }
      });
    });
  }

  async signProposal(proposalId: string, signatureData: SignatureData, clientIP: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Insert signature
        this.db.run(`
          INSERT INTO signatures (
            proposal_id, full_name, email, signed_at, ip_address, user_agent, agreed_to_terms
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          proposalId,
          signatureData.fullName,
          signatureData.email,
          signatureData.signedAt.toISOString(),
          clientIP,
          signatureData.userAgent,
          signatureData.agreedToTerms ? 1 : 0
        ]);

        // Lock the proposal
        this.db.run(`
          UPDATE proposals SET is_locked = 1 WHERE id = ?
        `, [proposalId], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  close(): void {
    this.db.close();
  }
}

export const db = new ProposalDatabase();