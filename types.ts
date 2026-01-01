
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

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  timestamp: string;
}

export type AppView = 'dashboard' | 'visualizer' | 'news';

export type ImageSize = '1K' | '2K' | '4K';
