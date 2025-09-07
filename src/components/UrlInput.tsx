'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Play, Loader2 } from 'lucide-react';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
}

export function UrlInput({ onAnalyze }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const { isLoading } = useAppStore();
  const t = (key: string) => getTranslation(useAppStore.getState().language, key);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onAnalyze(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-2">
        <Input
          type="url"
          placeholder={t('main.inputPlaceholder')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={!url.trim() || isLoading}
          className="px-6"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="ml-2">{t('main.analyzeButton')}</span>
        </Button>
      </div>
    </form>
  );
}
