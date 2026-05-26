# CourPath — 수강신청 가이드 시스템

> KoSBERT 임베딩 기반 과목-직무 매칭 분석 시스템  
> **Team 보글보글** 캡스톤 프로젝트

## 프로젝트 개요

학생의 이수/예정 과목과 목표 직무를 AI가 분석하여 **시너지·충돌 판정**, **선수과목 체크**, **맞춤 과목 추천**을 제공하는 웹 서비스입니다.

### 핵심 기능
- **과목-직무 유사도 분석**: KoSBERT(`jhgan/ko-sroberta-multitask`) 768차원 임베딩으로 과목 설명과 직무 기술스택 간 코사인 유사도 계산
- **가중 합산 판정**: 임베딩 유사도 60% + 키워드 스킬 매칭 40% → 시너지(≥55) / 보통 / 충돌(<25)
- **선수과목 충돌 감지**: 커리큘럼 선후수 관계 기반 미이수 선수과목 경고
- **학년 적합성 체크**: 학년 차이 ±2 이상 시 경고
- **맞춤 추천**: 미수강 과목 중 직무 유사도 TOP 5 추천

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | React 19, CRA (react-scripts 5.0.1) |
| **Backend** | FastAPI, SQLAlchemy, Pydantic |
| **Database** | PostgreSQL 15 |
| **AI/ML** | KoSBERT (sentence-transformers), scikit-learn |
| **Data** | 사람인 채용공고, 강의계획서 531개 과목 |

## 프로젝트 구조

```
CourPath/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py          # FastAPI 앱 진입점
│   │   ├── database.py      # DB 연결 설정
│   │   ├── models/          # SQLAlchemy 모델
│   │   ├── schemas/         # Pydantic 스키마
│   │   ├── routers/         # API 라우터
│   │   └── services/        # 분석 비즈니스 로직
│   ├── scripts/             # 데이터 로딩 & 유사도 계산 스크립트
│   ├── sql/schema.sql       # DB 스키마
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # React 프론트엔드
│   ├── src/
│   │   ├── App.jsx          # 5단계 위자드 메인
│   │   ├── components/      # Step1~5 컴포넌트
│   │   └── data/            # 로컬 과목/직무 데이터
│   └── package.json
├── data/                    # 원본 데이터 (JSON)
└── README.md
```

## API 명세

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/departments` | 학과 목록 조회 |
| GET | `/api/jobs` | 직무 카테고리/세부직무 목록 |
| GET | `/api/courses` | 전체 과목 목록 |
| GET | `/api/courses/available` | 이수 가능 과목 (선수과목 필터) |
| GET | `/api/prerequisites/{id}` | 특정 과목 선수과목 조회 |
| POST | `/api/analyze` | 과목-직무 매칭 분석 실행 |

### 분석 API 요청/응답

**Request:**
```json
{
  "department": "정보과학대학",
  "grade": 3,
  "job_subcategory": "백엔드 개발자",
  "completed_courses": ["685033", "605000"],
  "planned_courses": ["603135", "506819"]
}
```

**Response:**
```json
{
  "job_category": "백엔드 개발",
  "job_subcategory": "백엔드 개발자",
  "results": [
    {
      "course_id": "603135",
      "course_name": "웹서버구축",
      "similarity_score": 0.6974,
      "verdict": "시너지",
      "reason": "'백엔드 개발자' 직무 임베딩과 유사도 0.70 — 직무 연관성 높음",
      "prerequisite_ok": true,
      "missing_prerequisites": []
    }
  ],
  "recommendations": [...],
  "summary": { "시너지": 1, "보통": 0, "충돌": 0, "선수과목_미충족": 0 }
}
```

## 설치 및 실행

### 사전 요구사항
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### 1. 백엔드 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에서 DB 비밀번호 등 수정

# DB 스키마 생성
psql -U postgres -d courseguide -f sql/schema.sql

# 데이터 로딩
python scripts/load_courses.py
python scripts/load_jobs.py

# 임베딩 유사도 계산 (최초 1회, 약 5~10분 소요)
python scripts/compute_similarity.py

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

### 2. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행 (proxy → localhost:8000)
npm start
```

### 3. 접속
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000/docs (Swagger UI)

## 사용 흐름

```
[Step 1] 기본 정보 입력 (전공 대분류→소분류, 학년, 목표 직무)
    ↓
[Step 2] 기이수 과목 선택 (주전공 / 복수전공 / 타전공·기타)
    ↓
[Step 3] 다음 학기 수강 예정 과목 선택
    ↓
[Step 4] 목표 직무 확인
    ↓
[Step 5] AI 분석 결과 (시너지·충돌 판정 + 추천 과목 TOP 5)
```

## 팀원

**Team 보글보글**

## 라이선스

이 프로젝트는 교내 캡스톤 디자인 과제로 제작되었습니다.
