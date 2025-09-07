import OpenAI from 'openai';
import { LLMProvider, Recipe, YouTubeVideoInfo } from '@/types';

class OpenAIProvider implements LLMProvider {
  name = 'openai' as const;
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateRecipe(transcript: string, videoInfo: YouTubeVideoInfo): Promise<Recipe> {
    const prompt = `
다음 YouTube 요리 영상의 자막을 분석하여 구조화된 레시피를 생성해주세요.

영상 정보:
- 제목: ${videoInfo.title}
- URL: ${videoInfo.id}

자막 내용:
${transcript}

다음 JSON 형식으로 응답해주세요:
{
  "title": "레시피 제목",
  "summary": "요리 요약 (2-3문장)",
  "ingredients": ["재료1", "재료2", "재료3"],
  "tools": ["도구1", "도구2", "도구3"],
  "steps": [
    {
      "step": 1,
      "description": "단계 설명",
      "time": "소요시간 (선택사항)",
      "temperature": "온도 (선택사항)"
    }
  ],
  "totalTime": "총 소요시간",
  "tips": ["팁1", "팁2", "팁3"]
}

한국어로 응답해주세요.
`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 요리 전문가입니다. YouTube 요리 영상을 분석하여 정확하고 유용한 레시피를 생성합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('LLM 응답이 비어있습니다.');
      }

      console.log('OpenAI API 응답 내용:', content);

      // 백틱 제거
      const cleanedContent = content.replace(/```json|```/g, '');

      // JSON 파싱
      const recipeData = JSON.parse(cleanedContent);
      
      return {
        id: videoInfo.id,
        title: recipeData.title,
        summary: recipeData.summary,
        ingredients: recipeData.ingredients,
        tools: recipeData.tools,
        steps: recipeData.steps,
        totalTime: recipeData.totalTime,
        tips: recipeData.tips,
        videoUrl: `https://www.youtube.com/watch?v=${videoInfo.id}`,
        thumbnailUrl: videoInfo.thumbnailUrl,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('OpenAI API 오류:', error);
      throw new Error('레시피 생성 중 오류가 발생했습니다.');
    }
  }
}

class ClovaProvider implements LLMProvider {
  name = 'clova' as const;
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.CLOVA_API_KEY || '';
    this.apiUrl = process.env.CLOVA_API_URL || '';
  }

  async generateRecipe(transcript: string, videoInfo: YouTubeVideoInfo): Promise<Recipe> {
    // Clova Studio API 구현
    // 실제 구현은 Clova Studio API 문서에 따라 작성
    throw new Error('Clova Studio API는 아직 구현되지 않았습니다.');
  }
}

export const getLLMProvider = (): LLMProvider => {
  const provider = process.env.LLM_PROVIDER || 'openai';
  
  switch (provider) {
    case 'clova':
      return new ClovaProvider();
    case 'openai':
    default:
      return new OpenAIProvider();
  }
};
