@echo off
REM Windows용 Python 스크립트 실행 배치 파일
REM 가상환경을 활성화하고 Python 스크립트를 실행합니다.

cd /d "%~dp0.."
call venv\Scripts\activate
python scripts\youtube_extractor.py %*
