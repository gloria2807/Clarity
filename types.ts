
export interface AnalysisResult {
  problemClarity: string;
  hiddenAssumptions: string[];
  viablePaths: {
    option: string;
    description: string;
    tradeOffs: string;
    risks: string;
  }[];
  dataInsights?: {
    label: string;
    value: number;
  }[];
  recommendedDirection: {
    path: string;
    reasoning: string;
  };
  nextActions: string[];
  newsInsights?: string[];
}

export interface Note {
  id: string;
  timestamp: string;
  text: string;
  images: string[];
  summary: string;
  connections: string[];
  tags: string[];
}

export interface Milestone {
  id: string;
  title: string;
  deadline: string;
  status: 'planned' | 'in-progress' | 'completed';
  nextStep: string;
}

export interface QuickDecision {
  id: string;
  timestamp: string;
  problemClarity: string;
  hiddenAssumptions: string[];
  viablePaths: {
    option: string;
    description: string;
    tradeOffs: string;
    risks: string;
  }[];
  recommendedDirection: {
    path: string;
    reasoning: string;
  };
  nextActions: string[];
}

export interface HubRisk {
  id: string;
  type: 'Financial' | 'Operational' | 'Technical' | 'Market';
  description: string;
  impact: 'Low' | 'Medium' | 'High';
  mitigation: string;
  timestamp: string;
  images?: string[];
}

export interface HubTrend {
  id: string;
  observation: string;
  source: string;
  pattern: string;
  timestamp: string;
}

export interface HubInspiration {
  id: string;
  lesson: string;
  takeaway: string;
  source: string;
  timestamp: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  timestamp: string;
}

export type AppView = 'dashboard' | 'visualizer' | 'news' | 'notes' | 'milestones' | 'hub';

export type ImageSize = '1K' | '2K' | '4K';
