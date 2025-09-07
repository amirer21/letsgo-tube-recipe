import { YoutubeTranscript } from 'youtube-transcript';
import { TranscriptItem, YouTubeVideoInfo } from '@/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export async function getYouTubeVideoInfo(videoId: string): Promise<YouTubeVideoInfo> {
  // YouTube Data API를 사용하지 않고 기본 정보만 반환
  // 실제 구현에서는 YouTube Data API를 사용하여 더 정확한 정보를 가져올 수 있습니다.
  return {
    id: videoId,
    title: 'YouTube Video',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    duration: 'Unknown',
  };
}

export async function getYouTubeTranscript(videoId: string): Promise<TranscriptItem[]> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'ko', // 한국어 우선, 없으면 영어
    });

    return transcript.map((item: any) => ({
      text: item.text,
      start: item.offset / 1000, // 밀리초를 초로 변환
      duration: item.duration / 1000,
    }));
  } catch (error) {
    console.error('자막 추출 오류:', error);
    
    // 한국어 자막이 없으면 영어로 시도
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en',
      });

      return transcript.map((item: any) => ({
        text: item.text,
        start: item.offset / 1000,
        duration: item.duration / 1000,
      }));
    } catch (englishError) {
      console.error('영어 자막 추출도 실패:', englishError);
      throw new Error('이 영상의 자막을 추출할 수 없습니다. 자막이 활성화된 영상인지 확인해주세요.');
    }
  }
}

export function combineTranscript(transcript: TranscriptItem[]): string {
  return transcript
    .map(item => item.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Python 스크립트를 사용한 고급 자막 추출
export async function extractTranscriptWithPython(url: string, useWhisper: boolean = false): Promise<{
  videoInfo: YouTubeVideoInfo;
  transcript: string;
  method: string;
  success: boolean;
  error?: string;
}> {
  try {
    // Python 스크립트 직접 실행 (가상환경 활성화 포함)
    const isWindows = process.platform === 'win32';
    const pythonPath = isWindows 
      ? process.cwd() + '/venv/Scripts/python.exe'
      : process.cwd() + '/venv/bin/python';
    
    const scriptPath = process.cwd() + '/scripts/youtube_extractor.py';
    const command = `"${pythonPath}" "${scriptPath}" "${url}"${useWhisper ? ' --whisper' : ''}`;
    
    console.log('Python 스크립트 실행:', command);
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 300000, // 5분 타임아웃
    });

    if (stderr) {
      console.error('Python 스크립트 stderr:', stderr);
    }

    // JSON 결과 파싱 (stdout에서 JSON 부분 추출)
    const lines = stdout.split('\n');
    let jsonLine = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
        jsonLine = trimmedLine;
        break;
      }
    }

    if (!jsonLine) {
      throw new Error('Python 스크립트에서 유효한 JSON 결과를 받지 못했습니다.');
    }

    const result = JSON.parse(jsonLine);
    
    if (!result.success) {
      throw new Error(result.error || '자막 추출에 실패했습니다.');
    }

    return {
      videoInfo: {
        id: result.video_info.id,
        title: result.video_info.title,
        thumbnailUrl: result.video_info.thumbnail_url,
        duration: result.video_info.duration?.toString() || 'Unknown',
      },
      transcript: result.transcript,
      method: result.method,
      success: result.success,
    };

  } catch (error) {
    console.error('Python 스크립트 실행 오류:', error);
    
    // Python 스크립트 실패 시 기존 방법으로 폴백
    console.log('Python 스크립트 실패, 기존 방법으로 폴백...');
    
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('유효하지 않은 YouTube URL입니다.');
    }

    try {
      const transcript = await getYouTubeTranscript(videoId);
      const videoInfo = await getYouTubeVideoInfo(videoId);
      
      return {
        videoInfo,
        transcript: combineTranscript(transcript),
        method: 'fallback_transcript_api',
        success: true,
      };
    } catch (fallbackError) {
      throw new Error('모든 자막 추출 방법이 실패했습니다. 자막이 활성화된 영상인지 확인해주세요.');
    }
  }
}
