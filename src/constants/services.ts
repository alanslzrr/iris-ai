// src/constants/services.ts
// This file contains the content for the services section of the home page.
// It is used to display the services and their content in the home page.
// The content is displayed in the services section of the home page.
// The content is displayed in the services section of the home page.

export type ServiceContent = {
  id: 'requirements' | 'tolerance' | 'cmc';
  title: string;
  tagline: string;
  bullets: string[];
  sections: { heading: string; items: string[] }[];
};

export const servicesContent: ServiceContent[] = [
  {
    id: 'requirements',
    title: 'Certificate Requirements',
    tagline:
      'Auto‑verify certificates against technical, regulatory and client rules — fast and auditable.',
    bullets: [
      'Minutes, not days',
      'LLM‑assisted, metrology‑aware',
      'Traceable evidence per requirement',
    ],
    sections: [
      {
        heading: 'How it works',
        items: [
          'Upload PDF',
          'OCR + LLM → normalized JSON',
          'Identify rules: General, Client, Procedure, Equipment, Per asset',
          'Assess groups: compare, verify presence, check ranges',
          'Report: status, method and evidence',
        ],
      },
      {
        heading: 'Results',
        items: [
          'Up to 90% faster',
          'Consistent criteria',
          'Audit‑ready output',
        ],
      },
    ],
  },
  {
    id: 'tolerance',
    title: 'Tolerance',
    tagline:
      'Transform certificates into uniform data, find the right specs, and evaluate every point with clear reasoning.',
    bullets: [
      'Standardizes any certificate — any format, language, or scan',
      'Hierarchical spec search with coverage tracking',
      'Point-by-point tolerance evaluation with transparent logic',
    ],
    sections: [
      {
        heading: 'Search levels (L1–L5)',
        items: [
          'L1: Pre-validated internal rules (customer/equipment/model/asset)',
          'L2: Internal procedures; 2.5: use certificate’s own data when sufficient',
          'L3: Verified manuals from your private database',
          'L4: Extract + validate OEM manuals for future reuse',
          'L5: Controlled, guided web search with manufacturer/model validation',
        ],
      },
      {
        heading: 'Assessment & traceability',
        items: [
          'Per-point comparison, with partial coverage explicitly shown',
          'Avoids false negatives by marking points verified due to insufficient tolerance data',
          'Shows source, search level, and rationale for every applied spec',
          'Explains unit conversions and why each spec matched the point',
        ],
      },
      {
        heading: 'Benefits',
        items: [
          'Fast and scalable — from single files to large batches',
          'Consistent, documented evaluation logic',
          'Improves over time as your manual database grows',
          'Maximizes coverage through multi-tier search',
        ],
      },
    ],
  },
  {
    id: 'cmc',
    title: 'CMC',
    tagline: 'Evaluate every point against ISO/IEC 17025 — units normalized, decisions traceable.',
    bullets: [
    'End-to-end automation',
    'Reliable unit normalization',
    'Precise scope matching',
    ],
    sections: [
    {
    heading: 'Pipeline',
    items: [
    'Upload certificate → extract points',
    'Normalize units; map to scope',
    'Compute CMC; decide compliance',
    ],
    },
    {
    heading: 'Benefits',
    items: [
    'Scales to high volumes',
    'Consistent, traceable outcomes',
    'Accreditation-ready',
        ],
      },
    ],
  },
];


