'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { UrlInput } from '@/components/UrlInput';
import { RecipeCard } from '@/components/RecipeCard';
import { HistoryCard } from '@/components/HistoryCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAppStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Recipe, AnalysisHistory } from '@/types';
import { AlertCircle } from 'lucide-react';

export default function Home() {
  const {
    currentRecipe,
    analysisHistory,
    isLoading,
    error,
    language,
    setCurrentRecipe,
    addToHistory,
    setLoading,
    setError,
  } = useAppStore();

  const [loadingStage, setLoadingStage] = useState<'extracting' | 'whisper' | 'analyzing' | 'generating'>('extracting');
  const t = (key: string) => getTranslation(language, key);

  const analyzeVideo = async (url: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentRecipe(null);

      // 1단계: 자막 추출 시도
      setLoadingStage('extracting');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
                  // 자막이 없는 경우 Whisper API 사용 안내
                  if (errorData.error && errorData.error.includes('자막')) {
                    console.log('자막 오류 감지, Whisper API로 재시도...');
                    setLoadingStage('whisper');
                    
                    // Whisper 옵션으로 재시도
                    const whisperResponse = await fetch('/api/analyze', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ url, useWhisper: true }),
                    });

                    console.log('Whisper API 응답 상태:', whisperResponse.status);
                    console.log('Whisper API 응답 OK:', whisperResponse.ok);

                    if (!whisperResponse.ok) {
                      const whisperErrorData = await whisperResponse.json();
                      console.error('Whisper API 오류 데이터:', whisperErrorData);
                      throw new Error(whisperErrorData.error || '음성 인식에 실패했습니다.');
                    }

          setLoadingStage('analyzing');
          const { recipe } = await whisperResponse.json();
          setCurrentRecipe(recipe);

          // 히스토리에 추가
          const historyItem: AnalysisHistory = {
            id: recipe.id,
            videoUrl: recipe.videoUrl,
            title: recipe.title,
            thumbnailUrl: recipe.thumbnailUrl,
            analyzedAt: new Date(),
          };
          addToHistory(historyItem);
          return;
        }
        
        throw new Error(errorData.error || '분석에 실패했습니다.');
      }

      // 자막 추출 성공
      setLoadingStage('analyzing');
      const { recipe } = await response.json();
      setCurrentRecipe(recipe);

      // 히스토리에 추가
      const historyItem: AnalysisHistory = {
        id: recipe.id,
        videoUrl: recipe.videoUrl,
        title: recipe.title,
        thumbnailUrl: recipe.thumbnailUrl,
        analyzedAt: new Date(),
      };
      addToHistory(historyItem);

    } catch (error) {
      console.error('분석 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = (id: string) => {
    const newHistory = analysisHistory.filter(item => item.id !== id);
    useAppStore.setState({ analysisHistory: newHistory });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 메인 입력 섹션 */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">{t('app.title')}</h1>
            <p className="text-muted-foreground">{t('app.description')}</p>
            <UrlInput onAnalyze={analyzeVideo} />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading && <LoadingSpinner stage={loadingStage} />}

          {/* 현재 레시피 */}
          {currentRecipe && !isLoading && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">분석 결과</h2>
              <RecipeCard recipe={currentRecipe} />
            </div>
          )}

          {/* 최근 분석 내역 */}
          {analysisHistory.length > 0 && !isLoading && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{t('main.recentAnalyses')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisHistory.map((history) => (
                  <HistoryCard
                    key={history.id}
                    history={history}
                    onReanalyze={analyzeVideo}
                    onDelete={deleteHistory}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {!currentRecipe && !isLoading && analysisHistory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('main.noHistory')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
