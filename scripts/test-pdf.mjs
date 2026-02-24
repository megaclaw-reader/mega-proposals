import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// We need to test the PDF by creating a minimal version inline
// since we can't easily import TSX from a script

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjQ.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf', fontWeight: 700 },
  ],
});

const MEGA_BLUE = '#2563eb';

const s = StyleSheet.create({
  page: { fontFamily: 'Inter', fontSize: 9, color: '#1f2937', paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48, backgroundColor: '#ffffff' },
  headerBar: { backgroundColor: MEGA_BLUE, marginHorizontal: -48, marginTop: -48, paddingHorizontal: 48, paddingVertical: 36, marginBottom: 36 },
  headerMega: { fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 16, letterSpacing: 2 },
  headerTitle: { fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, fontWeight: 500, color: '#dbeafe' },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 },
  bodyText: { fontSize: 9.5, lineHeight: 1.6, color: '#374151' },
  sectionDivider: { borderBottomWidth: 2, borderBottomColor: MEGA_BLUE, marginBottom: 16, width: 40 },
});

const TestDoc = React.createElement(Document, {},
  React.createElement(Page, { size: 'LETTER', style: s.page },
    React.createElement(View, { style: s.headerBar },
      React.createElement(Text, { style: s.headerMega }, 'MEGA'),
      React.createElement(Text, { style: s.headerTitle }, 'Statement of Work'),
      React.createElement(Text, { style: s.headerSubtitle }, 'SEO & GEO Agent + Paid Ads Agent + Website Agent'),
    ),
    React.createElement(Text, { style: s.sectionTitle }, 'Executive Summary'),
    React.createElement(View, { style: s.sectionDivider }),
    React.createElement(Text, { style: s.bodyText }, 'This Statement of Work outlines a comprehensive AI-driven marketing strategy designed to generate high-quality leads for your business.'),
  )
);

console.log('Rendering PDF...');
const buffer = await renderToBuffer(TestDoc);
const outPath = path.join(process.cwd(), 'test-output.pdf');
fs.writeFileSync(outPath, buffer);
console.log(`PDF written to ${outPath} (${buffer.length} bytes)`);
