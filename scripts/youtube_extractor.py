#!/usr/bin/env python3
"""
YouTube 자막 추출 및 음성 인식 스크립트
검증된 코드를 기반으로 구현
"""

import os
import sys
import json
import tempfile
from datetime import datetime
from urllib.parse import urlparse, parse_qs

import io  # io 모듈을 import

# Set the standard output to UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경변수 로드
from dotenv import load_dotenv
# .env.local 파일을 직접 로드
load_dotenv('.env.local')

# YouTube 자막 API
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

# OpenAI SDK
from openai import OpenAI

# yt-dlp for audio download
import yt_dlp

# faster-whisper for local transcription
try:
    from faster_whisper import WhisperModel
    FASTER_WHISPER_AVAILABLE = True
except ImportError:
    FASTER_WHISPER_AVAILABLE = False

# 전역 변수
client = None

# ───────────────────────────────
# 1. 환경 설정
# ───────────────────────────────
def init_env():
    global client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI_API_KEY가 없습니다. .env.local 파일을 확인하세요.")
        return False
    client = OpenAI(api_key=api_key)
    return True

# ───────────────────────────────
# 2. 유틸: URL → video_id
# ───────────────────────────────
def extract_video_id(url: str) -> str:
    """
    다양한 유튜브 URL에서 안정적으로 video_id를 추출합니다.
    예: https://www.youtube.com/watch?v=XXXX, https://youtu.be/XXXX, Shorts 등
    """
    try:
        parsed = urlparse(url.strip())
        if parsed.netloc in ("youtu.be", "www.youtu.be"):
            return parsed.path.lstrip("/")
        if "watch" in parsed.path:
            q = parse_qs(parsed.query)
            if "v" in q:
                return q["v"][0]
        # shorts, embed 등 포맷
        parts = [p for p in parsed.path.split("/") if p]
        if parts:
            return parts[-1]
    except Exception:
        pass
    # 마지막 폴백: 'v=' 분리
    if "v=" in url:
        return url.split("v=")[-1].split("&")[0]
    return url.strip()

# ───────────────────────────────
# 3. 1차/2차: YouTubeTranscriptApi로 자막 추출
# ───────────────────────────────
def try_transcript_api(video_id: str, preferred_langs=("ko", "en", "ja")) -> str:
    """
    1) 명시 트랙 → 2) 자동 생성 트랙 → 3) 번역(translate) 트랙 순으로 시도
    """
    try:
        # 올바른 사용법: 인스턴스 메서드 사용
        api = YouTubeTranscriptApi()
        listing = api.list(video_id)

        # 1) 우선: 명시 트랙
        for lang in preferred_langs:
            try:
                t = listing.find_transcript([lang])
                chunks = t.fetch()
                return " ".join([c["text"] for c in chunks])
            except Exception:
                pass

        # 2) 자동 생성 트랙
        try:
            gen = listing.find_generated_transcript(list(preferred_langs))
            chunks = gen.fetch()
            return " ".join([c["text"] for c in chunks])
        except Exception:
            pass

        # 3) 번역 트랙(예: 영어 → 한국어)
        # 일부 트랜스크립트 객체는 translate 지원
        for transcript in listing:
            try:
                t_ko = transcript.translate("ko")
                chunks = t_ko.fetch()
                return " ".join([c["text"] for c in chunks])
            except Exception:
                continue

        return ""
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable) as e:
        print(f"자막 API 실패: {type(e).__name__} - {e}")
        return ""
    except Exception as e:
        print(f"자막 API 알 수 없는 실패: {e}")
        return ""

# ───────────────────────────────
# 4. 3차 폴백: yt-dlp + Whisper ASR
# ───────────────────────────────
def download_audio(url: str) -> str:
    """
    yt-dlp로 오디오만 임시 파일에 저장하고 파일 경로를 리턴
    """
    tmpdir = tempfile.mkdtemp(prefix="yt_")
    outtmpl = os.path.join(tmpdir, "audio.%(ext)s")
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": outtmpl,
        "quiet": True,
        "noplaylist": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    # 저장된 파일 경로 찾기
    for f in os.listdir(tmpdir):
        if f.startswith("audio."):
            return os.path.join(tmpdir, f)
    raise RuntimeError("오디오 파일을 찾을 수 없습니다.")

def transcribe_with_openai_whisper(audio_path: str, language: str = None) -> str:
    """
    OpenAI Whisper API로 음성 → 텍스트 전사
    language=None 이면 자동 감지
    """
    if not client:
        raise RuntimeError("OpenAI 클라이언트가 초기화되지 않았습니다.")
    
    with open(audio_path, "rb") as f:
        # 최신 엔드포인트 예시 (whisper-1)
        result = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            language=language  # "ko" / "en" or None
        )
    # SDK에 따라 속성명이 다를 수 있음. 아래는 dict 접근 예시 방어.
    text = getattr(result, "text", None) or result.get("text", "")
    return text

# (선택) 로컬 faster-whisper 사용하고 싶을 때
def transcribe_with_faster_whisper(audio_path: str) -> str:
    if not FASTER_WHISPER_AVAILABLE:
        raise RuntimeError("faster-whisper가 설치되지 않았습니다.")
    
    model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, _info = model.transcribe(audio_path, vad_filter=True)
    return " ".join([seg.text.strip() for seg in segments])

# ───────────────────────────────
# 5. 비디오 정보 가져오기
# ───────────────────────────────
def get_video_info(video_id: str) -> dict:
    """
    yt-dlp를 사용하여 비디오 정보를 가져옵니다.
    """
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            
            return {
                'id': video_id,
                'title': info.get('title', 'Unknown Title'),
                'thumbnail_url': info.get('thumbnail', f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg'),
                'duration': info.get('duration', 0),
                'description': info.get('description', ''),
                'uploader': info.get('uploader', ''),
            }
    except Exception as e:
        print(f"비디오 정보 가져오기 실패: {e}")
        return {
            'id': video_id,
            'title': 'Unknown Title',
            'thumbnail_url': f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg',
            'duration': 0,
            'description': '',
            'uploader': '',
        }

# ───────────────────────────────
# 6. 메인 추출 함수
# ───────────────────────────────
def extract_transcript(url: str, use_whisper: bool = False) -> dict:
    """
    YouTube URL에서 자막을 추출합니다.
    """
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("유효하지 않은 YouTube URL입니다.")
    
    print(f"비디오 ID: {video_id}")
    
    # 비디오 정보 가져오기
    video_info = get_video_info(video_id)
    print(f"제목: {video_info['title']}")
    
    # 1/2단계: transcript API
    print("[1] 자막 API 시도 중...")
    transcript = try_transcript_api(video_id)
    
    if not transcript and use_whisper:
        print("[2] 자막 없음 -> ASR 폴백(오디오 다운로드) 시도...")
        try:
            audio_path = download_audio(url)
            print(f"오디오 저장 완료: {audio_path}")
            
            # OpenAI Whisper
            if client:
                transcript = transcribe_with_openai_whisper(audio_path)
                if transcript:
                    print(f"Whisper API 성공 ({len(transcript)} 문자)")
                    return {
                        'video_info': video_info,
                        'transcript': transcript,
                        'method': 'whisper_api',
                        'success': True
                    }
            
            # 로컬 faster-whisper 시도
            if FASTER_WHISPER_AVAILABLE:
                print("OpenAI Whisper 실패 -> 로컬 faster-whisper 시도...")
                transcript = transcribe_with_faster_whisper(audio_path)
                if transcript:
                    print(f"faster-whisper 성공 ({len(transcript)} 문자)")
                    return {
                        'video_info': video_info,
                        'transcript': transcript,
                        'method': 'faster_whisper',
                        'success': True
                    }
                    
        except Exception as e:
            print(f"ASR 폴백 실패: {e}")
    
    if transcript:
        print(f"자막 추출 성공 ({len(transcript)} 문자)")
        return {
            'video_info': video_info,
            'transcript': transcript,
            'method': 'transcript_api',
            'success': True
        }
    
    # 모든 방법 실패
    return {
        'video_info': video_info,
        'transcript': '',
        'method': 'none',
        'success': False,
        'error': '자막 추출에 실패했습니다.'
    }

def main():
    """메인 함수 - CLI에서 직접 실행할 때 사용"""
    # 도움말 표시
    if "--help" in sys.argv or "-h" in sys.argv or len(sys.argv) == 1:
        print("YouTube 자막 추출기")
        print("사용법: python youtube_extractor.py <YouTube_URL> [--whisper]")
        print("옵션:")
        print("  --whisper, -w    Whisper API를 사용한 음성 인식 활성화")
        print("  --help, -h       이 도움말 표시")
        print("\n예시:")
        print("  python youtube_extractor.py 'https://www.youtube.com/watch?v=VIDEO_ID'")
        print("  python youtube_extractor.py 'https://www.youtube.com/watch?v=VIDEO_ID' --whisper")
        return
    
    # 환경 초기화
    if not init_env():
        error_result = {
            'success': False,
            'error': 'OpenAI API 키가 설정되지 않았습니다.',
            'video_info': {'id': '', 'title': '', 'thumbnail_url': '', 'duration': 0},
            'transcript': '',
            'method': 'error'
        }
        print(json.dumps(error_result, ensure_ascii=False))
        return
    
    if len(sys.argv) < 2:
        url = input("YouTube URL 입력: ").strip()
    else:
        url = sys.argv[1]
    
    use_whisper = "--whisper" in sys.argv or "-w" in sys.argv
    
    try:
        result = extract_transcript(url, use_whisper=use_whisper)
        
        # JSON 결과를 stdout에 출력 (Next.js에서 파싱하기 위해)
        print(json.dumps(result, ensure_ascii=False))
        
        if result['success']:
            print(f"\n추출된 자막 (방법: {result['method']}):", file=sys.stderr)
            print("-" * 50, file=sys.stderr)
            print(result['transcript'][:500] + "..." if len(result['transcript']) > 500 else result['transcript'], file=sys.stderr)
            print("-" * 50, file=sys.stderr)
            
            # JSON 파일로 저장
            output_file = f"transcript_{result['video_info']['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            print(f"결과 저장: {output_file}", file=sys.stderr)
        else:
            print(f"자막 추출 실패: {result.get('error', '알 수 없는 오류')}", file=sys.stderr)
            
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'video_info': {'id': '', 'title': '', 'thumbnail_url': '', 'duration': 0},
            'transcript': '',
            'method': 'error'
        }
        print(json.dumps(error_result, ensure_ascii=False))
        print(f"오류 발생: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
