export const translations = {
  ko: {
    app: {
      title: 'YouTube 레시피 요약',
      description: 'YouTube 요리 영상을 분석하여 구조화된 레시피를 생성합니다',
    },
    main: {
      inputPlaceholder: 'YouTube URL을 입력하세요',
      analyzeButton: '분석하기',
      recentAnalyses: '최근 분석 내역',
      noHistory: '분석 내역이 없습니다',
    },
    recipe: {
      ingredients: '재료',
      tools: '필요한 도구',
      steps: '조리 과정',
      totalTime: '총 소요시간',
      tips: '요리 팁',
      step: '단계',
    },
    error: {
      invalidUrl: '유효하지 않은 YouTube URL입니다',
      noTranscript: '자막을 찾을 수 없습니다',
      analysisFailed: '분석에 실패했습니다',
      networkError: '네트워크 오류가 발생했습니다',
    },
    loading: {
      extracting: '자막을 추출하는 중...',
      whisper: '자막이 없어서 음성을 텍스트로 변환하는 중...',
      analyzing: '레시피를 분석하는 중...',
      generating: '레시피를 생성하는 중...',
    },
  },
  en: {
    app: {
      title: 'YouTube Recipe Summarizer',
      description: 'Analyze YouTube cooking videos and generate structured recipes',
    },
    main: {
      inputPlaceholder: 'Enter YouTube URL',
      analyzeButton: 'Analyze',
      recentAnalyses: 'Recent Analyses',
      noHistory: 'No analysis history',
    },
    recipe: {
      ingredients: 'Ingredients',
      tools: 'Required Tools',
      steps: 'Cooking Steps',
      totalTime: 'Total Time',
      tips: 'Cooking Tips',
      step: 'Step',
    },
    error: {
      invalidUrl: 'Invalid YouTube URL',
      noTranscript: 'No transcript found',
      analysisFailed: 'Analysis failed',
      networkError: 'Network error occurred',
    },
    loading: {
      extracting: 'Extracting transcript...',
      whisper: 'No subtitles found, converting audio to text...',
      analyzing: 'Analyzing recipe...',
      generating: 'Generating recipe...',
    },
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.ko;

export function getTranslation(language: Language, key: string): string {
  const keys = key.split('.') as (keyof typeof translations.ko)[];
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}
