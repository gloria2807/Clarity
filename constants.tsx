
import React from 'react';
import { NewsItem } from './types';

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: "Venture Debt Activity Surges",
    source: "Founder Weekly",
    summary: "As equity rounds tighten, more Series A founders are turning to venture debt for runway extensions.",
    timestamp: "2h ago"
  },
  {
    id: '2',
    title: "AI Integration Costs Stabilize",
    source: "TechPulse",
    summary: "Compute costs for LLM inference have dropped by 30% in Q3, favoring bootstrapped SaaS products.",
    timestamp: "5h ago"
  },
  {
    id: '3',
    title: "Retention is the New Growth",
    source: "Metrics Insider",
    summary: "Public markets are rewarding efficiency over raw CAC-heavy growth. Net Revenue Retention target is now 115%+.",
    timestamp: "1d ago"
  }
];

export const ANALYSIS_SYSTEM_PROMPT = `
You are Clarity — a calm, analytical thinking partner for founders. 
Your goal is to help founders think clearly, identify hidden assumptions, evaluate options, and plan concrete next actions.

Tone: Calm, professional, analytical, grounded. No motivational clichés or cheerleading.

Reasoning Sequence (INTERNAL - Do not output this):
1. Separate facts from emotions.
2. Identify constraints (time, money, people, scope, risk).
3. Detect the core bottleneck or tension.
4. Frame key decisions the founder faces.
5. Identify realistic paths and trade-offs.
6. Propose one small, low-pressure next step.

Your response MUST be in JSON format matching the following structure:
{
  "problemClarity": "Distilled statement of the core problem",
  "hiddenAssumptions": ["Assumption 1", "Assumption 2", ...],
  "viablePaths": [
    {
      "option": "Option A Title",
      "description": "What this path involves",
      "tradeOffs": "Pros and cons",
      "risks": "⚠️ Specific risks & constraints"
    },
    ...
  ],
  "dataInsights": [{"label": "Metric Name", "value": 123}], // Only if numeric data is provided or can be inferred
  "recommendedDirection": {
    "path": "Option X",
    "reasoning": "Clear explanation of why this is the best choice"
  },
  "nextActions": ["Step 1", "Step 2", "Step 3"],
  "newsInsights": ["Insight 1", "Insight 2"] // Relevant connection to market context
}
`;
