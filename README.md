# YouTube Recipe Summarizer

YouTube 요리 영상을 분석하여 구조화된 레시피를 생성하는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **고급 YouTube 자막 추출**: 
  - youtube-transcript-api를 사용한 다중 언어 자막 추출
  - 자동 생성 자막 및 번역 자막 지원
  - 자막이 없는 영상의 경우 Whisper API를 통한 음성 인식
- **AI 레시피 분석**: OpenAI GPT-4o-mini를 사용하여 자막을 분석하고 구조화된 레시피 생성
- **레시피 구조화**: 재료, 도구, 조리 과정, 소요시간, 팁 등을 체계적으로 정리
- **최근 분석 내역**: 로컬 스토리지를 사용한 분석 히스토리 관리
- **다국어 지원**: 한국어/영어 UI 지원
- **반응형 디자인**: 모바일과 데스크톱 모두 지원
- **폴백 시스템**: Python 스크립트 실패 시 기존 방법으로 자동 전환

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Lucide React
- **상태관리**: Zustand
- **AI**: OpenAI GPT-4o-mini
- **자막 추출**: 
  - youtube-transcript (기본)
  - youtube-transcript-api (고급)
  - yt-dlp (오디오 다운로드)
- **음성 인식**: 
  - OpenAI Whisper API
  - faster-whisper (로컬)
- **Python 환경**: 가상환경 + pip
- **스타일링**: Tailwind CSS

## 📦 설치 및 실행

### 1. Node.js 의존성 설치
```bash
npm install
```

### 2. Python 환경 설정
```bash
# Python 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
venv\Scripts\activate

# 가상환경 활성화 (Linux/Mac)
source venv/bin/activate

# Python 의존성 설치
pip install -r requirements.txt
```

### 3. 환경변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# OpenAI API Key (필수)
OPENAI_API_KEY=your_openai_api_key_here

# NAVER Clova Studio API (선택사항 - OpenAI 대안)
CLOVA_API_KEY=your_clova_api_key_here
CLOVA_API_URL=your_clova_api_url_here

# Whisper API (선택사항 - 음성 인식용)
ENABLE_WHISPER=false

# 앱 설정
NEXT_PUBLIC_APP_NAME="YouTube Recipe Summarizer"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

### 5. Python 스크립트 테스트 (선택사항)
```bash
# 가상환경 활성화 후
python scripts/test_extractor.py

# 또는 직접 스크립트 실행
python scripts/youtube_extractor.py "https://www.youtube.com/watch?v=VIDEO_ID"
```

## 🎯 사용법

1. **YouTube URL 입력**: 분석하고 싶은 YouTube 요리 영상의 URL을 입력
2. **분석 시작**: "분석하기" 버튼을 클릭
3. **결과 확인**: AI가 생성한 구조화된 레시피를 확인
4. **히스토리 관리**: 최근 분석 내역에서 이전 결과를 다시 확인하거나 재분석

## 📋 레시피 구조

생성되는 레시피는 다음 구조를 포함합니다:

- **제목**: 요리 이름
- **요약**: 요리에 대한 간단한 설명
- **재료**: 필요한 재료 목록
- **도구**: 필요한 조리 도구
- **조리 과정**: 단계별 조리 방법
- **총 소요시간**: 전체 조리 시간
- **요리 팁**: 유용한 조리 팁

## 🔧 API 엔드포인트

### POST /api/analyze
YouTube 영상을 분석하여 레시피를 생성합니다.

**요청:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**응답:**
```json
{
  "recipe": {
    "id": "VIDEO_ID",
    "title": "레시피 제목",
    "summary": "요리 요약",
    "ingredients": ["재료1", "재료2"],
    "tools": ["도구1", "도구2"],
    "steps": [
      {
        "step": 1,
        "description": "조리 설명",
        "time": "소요시간",
        "temperature": "온도"
      }
    ],
    "totalTime": "총 소요시간",
    "tips": ["팁1", "팁2"],
    "videoUrl": "YouTube URL",
    "thumbnailUrl": "썸네일 URL",
    "createdAt": "생성일시"
  }
}
```

## 🌐 다국어 지원

- 한국어 (기본)
- 영어

언어는 헤더의 언어 토글 버튼으로 변경할 수 있습니다.

## 📱 반응형 디자인

- **모바일**: 320px 이상
- **태블릿**: 768px 이상  
- **데스크톱**: 1024px 이상

## 🔒 보안

- API 키는 서버 사이드에서만 사용
- 클라이언트에서는 민감한 정보 노출 방지
- CORS 설정으로 안전한 API 호출

## 🚀 배포

### Vercel 배포
```bash
npm run build
vercel --prod
```

### Docker 배포
```bash
docker build -t youtube-recipe-app .
docker run -p 3000:3000 youtube-recipe-app
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## ⚠️ 주의사항

- YouTube 자막이 활성화된 영상만 분석 가능
- OpenAI API 사용량에 따른 비용 발생
- 네트워크 연결이 필요
- 일부 영상은 자막 추출이 불가능할 수 있음

## 🆘 문제 해결

### 자막을 찾을 수 없는 경우
- 영상에 자막이 활성화되어 있는지 확인
- 다른 YouTube 영상으로 시도
- 영상이 비공개이거나 제한된 경우

### API 오류가 발생하는 경우
- OpenAI API 키가 올바른지 확인
- API 사용량 한도 확인
- 네트워크 연결 상태 확인

## 📞 지원

문제가 발생하거나 기능 요청이 있으시면 GitHub Issues를 통해 문의해주세요.