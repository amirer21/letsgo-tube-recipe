import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, getYouTubeVideoInfo, getYouTubeTranscript, combineTranscript, extractTranscriptWithPython } from '@/lib/youtube';
import { getLLMProvider } from '@/lib/llm-providers';

export async function POST(request: NextRequest) {
  try {
    const { url, useWhisper = false } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL이 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('분석 시작:', { url, useWhisper });

    let videoInfo;
    let transcriptText;
    let extractionMethod;

    try {
      // 1단계: Python 스크립트를 사용한 고급 자막 추출 시도
      console.log('Python 스크립트를 사용한 자막 추출 시도...', { url, useWhisper });
      const pythonResult = await extractTranscriptWithPython(url, useWhisper);
      
      console.log('Python 스크립트 결과:', {
        success: pythonResult.success,
        method: pythonResult.method,
        transcriptLength: pythonResult.transcript?.length || 0,
        error: pythonResult.error
      });
      
      if (pythonResult.success) {
        videoInfo = pythonResult.videoInfo;
        transcriptText = pythonResult.transcript;
        extractionMethod = pythonResult.method;
        console.log(`Python 스크립트 성공 (방법: ${extractionMethod})`);
      } else {
        throw new Error(pythonResult.error || 'Python 스크립트 실패');
      }
    } catch (pythonError) {
      console.error('Python 스크립트 실패, 기존 방법으로 폴백...', pythonError);
      
      // 2단계: 기존 방법으로 폴백
      const videoId = extractVideoId(url);
      if (!videoId) {
        return NextResponse.json(
          { error: '유효하지 않은 YouTube URL입니다.' },
          { status: 400 }
        );
      }

      videoInfo = await getYouTubeVideoInfo(videoId);
      const transcript = await getYouTubeTranscript(videoId);
      transcriptText = combineTranscript(transcript);
      extractionMethod = 'fallback_transcript_api';
    }

    if (!transcriptText.trim()) {
      return NextResponse.json(
        { error: '자막을 찾을 수 없습니다. 자막이 활성화된 영상인지 확인해주세요.' },
        { status: 400 }
      );
    }

    console.log(`자막 추출 완료 (방법: ${extractionMethod}, 길이: ${transcriptText.length} 문자)`);

    // LLM을 사용하여 레시피 생성
    console.log('레시피 생성 시작...');
    const llmProvider = getLLMProvider();
    const recipe = await llmProvider.generateRecipe(transcriptText, videoInfo);

    console.log('레시피 생성 완료:', recipe.title);

    return NextResponse.json({ 
      recipe,
      extractionMethod,
      transcriptLength: transcriptText.length
    });

  } catch (error) {
    console.error('분석 오류:', error);
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
