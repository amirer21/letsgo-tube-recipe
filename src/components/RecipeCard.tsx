'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Recipe } from '@/types';
import { useAppStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Clock, ChefHat, Utensils, Lightbulb } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { language } = useAppStore();
  const t = (key: string) => getTranslation(language, key);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{recipe.title}</CardTitle>
            <p className="text-muted-foreground text-sm">{recipe.summary}</p>
          </div>
          {recipe.thumbnailUrl && (
            <img
              src={recipe.thumbnailUrl}
              alt={recipe.title}
              className="w-20 h-20 object-cover rounded-lg ml-4"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 재료 */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center">
            <ChefHat className="h-4 w-4 mr-2" />
            {t('recipe.ingredients')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.map((ingredient, index) => (
              <Badge key={index} variant="secondary">
                {ingredient}
              </Badge>
            ))}
          </div>
        </div>

        {/* 도구 */}
        {recipe.tools.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <Utensils className="h-4 w-4 mr-2" />
              {t('recipe.tools')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {recipe.tools.map((tool, index) => (
                <Badge key={index} variant="outline">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 조리 과정 */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            {t('recipe.steps')}
          </h3>
          <div className="space-y-3">
            {recipe.steps.map((step) => (
              <div key={step.step} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{step.description}</p>
                  {(step.time || step.temperature) && (
                    <div className="flex gap-2 mt-1">
                      {step.time && (
                        <Badge variant="outline" className="text-xs">
                          {step.time}
                        </Badge>
                      )}
                      {step.temperature && (
                        <Badge variant="outline" className="text-xs">
                          {step.temperature}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 총 소요시간 */}
        {recipe.totalTime && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{t('recipe.totalTime')}: {recipe.totalTime}</span>
          </div>
        )}

        {/* 팁 */}
        {recipe.tips.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              {t('recipe.tips')}
            </h3>
            <ul className="space-y-1">
              {recipe.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
