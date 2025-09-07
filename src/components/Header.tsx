'use client';

import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export function Header() {
  const { language, setLanguage } = useAppStore();
  const t = (key: string) => getTranslation(language, key);

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">{t('app.title')}</h1>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center space-x-2"
        >
          <Globe className="h-4 w-4" />
          <span>{language === 'ko' ? 'EN' : '한'}</span>
        </Button>
      </div>
    </header>
  );
}
