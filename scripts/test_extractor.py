#!/usr/bin/env python3
"""
YouTube 자막 추출기 테스트 스크립트
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from youtube_extractor import YouTubeExtractor

def test_extractor():
    """자막 추출기 테스트"""
    extractor = YouTubeExtractor()
    
    # 테스트용 YouTube URL (요리 영상)
    test_urls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Rick Roll (테스트용)
        # 실제 요리 영상 URL을 여기에 추가하세요
    ]
    
    for url in test_urls:
        print(f"\n🔍 테스트 URL: {url}")
        try:
            result = extractor.extract_transcript(url, use_whisper=False)
            
            if result['success']:
                print(f"✅ 성공! 방법: {result['method']}")
                print(f"📹 제목: {result['video_info']['title']}")
                print(f"📄 자막 길이: {len(result['transcript'])} 문자")
                print(f"📝 자막 미리보기: {result['transcript'][:200]}...")
            else:
                print(f"❌ 실패: {result.get('error', '알 수 없는 오류')}")
                
        except Exception as e:
            print(f"❌ 예외 발생: {e}")

if __name__ == "__main__":
    test_extractor()
