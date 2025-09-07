import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, AnalysisHistory, Recipe } from '@/types';

interface AppStore extends AppState {
  setCurrentRecipe: (recipe: Recipe | null) => void;
  addToHistory: (history: AnalysisHistory) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLanguage: (language: 'ko' | 'en') => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentRecipe: null,
      analysisHistory: [],
      isLoading: false,
      error: null,
      language: 'ko',

      setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),
      
      addToHistory: (history) => set((state) => ({
        analysisHistory: [history, ...state.analysisHistory].slice(0, 10) // Keep only last 10
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setLanguage: (language) => set({ language }),
      
      clearHistory: () => set({ analysisHistory: [] }),
    }),
    {
      name: 'youtube-recipe-store',
      partialize: (state) => ({
        analysisHistory: state.analysisHistory,
        language: state.language,
      }),
    }
  )
);
