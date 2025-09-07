'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalysisHistory } from '@/types';
import { useAppStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Play, Trash2, ExternalLink } from 'lucide-react';

interface HistoryCardProps {
  history: AnalysisHistory;
  onReanalyze: (url: string) => void;
  onDelete: (id: string) => void;
}

export function HistoryCard({ history, onReanalyze, onDelete }: HistoryCardProps) {
  const { language } = useAppStore();
  const t = (key: string) => getTranslation(language, key);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium line-clamp-2 mb-1">
              {history.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {formatDate(history.analyzedAt)}
            </p>
          </div>
          {history.thumbnailUrl && (
            <img
              src={history.thumbnailUrl}
              alt={history.title}
              className="w-12 h-12 object-cover rounded ml-3 flex-shrink-0"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReanalyze(history.videoUrl)}
            className="flex-1"
          >
            <Play className="h-3 w-3 mr-1" />
            재분석
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(history.videoUrl, '_blank')}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(history.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
