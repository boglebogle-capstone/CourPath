#!/usr/bin/env bash
# Render 빌드 스크립트
# Web Service의 Build Command에 이 파일 경로 지정: ./build.sh

set -o errexit  # 에러 발생 시 즉시 종료

echo "=== 1. 프론트엔드 빌드 ==="
cd frontend
npm install
npm run build
cd ..

echo "=== 2. 백엔드 의존성 설치 ==="
cd backend
pip install -r requirements.txt

echo "=== 3. DB 스키마 생성 ==="
psql $DATABASE_URL -f sql/schema.sql

echo "=== 4. seed 데이터 로딩 ==="
psql $DATABASE_URL -f sql/seed.sql

echo "=== 빌드 완료! ==="
