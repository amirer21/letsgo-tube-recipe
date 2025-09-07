#!/bin/bash
# Linux/Mac용 Python 스크립트 실행 스크립트
# 가상환경을 활성화하고 Python 스크립트를 실행합니다.

cd "$(dirname "$0")/.."
source venv/bin/activate
python scripts/youtube_extractor.py "$@"
