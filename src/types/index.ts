export interface Recipe {
  id: string;
  title: string;
  summary: string;
  ingredients: string[];
  tools: string[];
  steps: RecipeStep[];
  totalTime: string;
  tips: string[];
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt: Date;
}

export interface RecipeStep {
  step: number;
  description: string;
  time?: string;
  temperature?: string;
}

export interface AnalysisHistory {
  id: string;
  videoUrl: string;
  title: string;
  thumbnailUrl?: string;
  analyzedAt: Date;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
}

export interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

export interface LLMProvider {
  name: 'openai' | 'clova';
  generateRecipe: (transcript: string, videoInfo: YouTubeVideoInfo) => Promise<Recipe>;
}

export interface AppState {
  currentRecipe: Recipe | null;
  analysisHistory: AnalysisHistory[];
  isLoading: boolean;
  error: string | null;
  language: 'ko' | 'en';
}
