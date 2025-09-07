'use client';

import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  stage: 'extracting' | 'whisper' | 'analyzing' | 'generating';
}

export function LoadingSpinner({ stage }: LoadingSpinnerProps) {
  const { language } = useAppStore();
  const t = (key: string) => getTranslation(language, key);

  const getProgress = () => {
    switch (stage) {
      case 'extracting':
        return 25;
      case 'whisper':
        return 50;
      case 'analyzing':
        return 75;
      case 'generating':
        return 100;
      default:
        return 0;
    }
  };

  const getStageText = () => {
    switch (stage) {
      case 'extracting':
        return t('loading.extracting');
      case 'whisper':
        return t('loading.whisper');
      case 'analyzing':
        return t('loading.analyzing');
      case 'generating':
        return t('loading.generating');
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">{getStageText()}</p>
        <Progress value={getProgress()} className="w-64" />
      </div>
    </div>
  );
}
