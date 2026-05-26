"""
충돌/시너지 분석 서비스
- 알고리즘 팀(방민정) 로직 반영
- 임베딩 유사도 기반 시너지/충돌 판정
- 학년 충돌 / 선수과목 충돌 / 시너지 감지
"""
import json
import numpy as np
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from app.models.course import Course, CoursePrerequisite
from app.models.job import JobCategory
from app.schemas.analyze import (
    AnalyzeRequest,
    AnalyzeResponse,
    CourseResult,
    RecommendationOut,
    AnalyzeSummary,
)
from app.services.similarity import get_course_job_similarity, get_top_similar_courses

# ── 알고리즘 팀 임계값 (2차 수정 반영) ──
EMBEDDING_WEIGHT = 0.6
SKILL_WEIGHT = 0.4
SYNERGY_THRESHOLD = 0.52        # 유사도 임계값 (0.55 → 0.52 완화)
SYNERGY_MIN_KEYWORDS = 1        # 키워드 오버랩 최소 개수
CONFLICT_THRESHOLD = 0.30       # 충돌 임계값 (0.25 → 0.30 상향)
GRADE_HIGH_DIFF = 1
GRADE_LOW_DIFF = -1

# ── 복수전공 연계 키워드 ──
MAJOR_KEYWORDS = {
    '경영대학':       ['데이터분석', '시각화', '통계', '마케팅', '비용', '수익', '경영', '회계'],
    '사회과학대학':   ['통계', '데이터분석', '사회', '정책', '법', '심리'],
    '인문대학':       ['언어', '텍스트', '문화', '소통', '글쓰기'],
    '미디어스쿨':     ['미디어', '영상', '콘텐츠', '디자인', 'UX', 'UI'],
    '글로벌융합대학': ['융합', '국제', '글로벌', '혁신'],
    '미래융합스쿨':   ['융합', '혁신', '기술', '스타트업'],
}

# ── 직무_기술스택_프로필 로드 ──
SKILL_PROFILE_PATH = Path(__file__).resolve().parents[2] / "data" / "직무_기술스택_프로필.json"
_skill_profile_cache = None


def _load_skill_profile() -> dict:
    global _skill_profile_cache
    if _skill_profile_cache is None:
        try:
            with open(SKILL_PROFILE_PATH, encoding="utf-8") as f:
                _skill_profile_cache = json.load(f)
        except FileNotFoundError:
            _skill_profile_cache = {}
    return _skill_profile_cache


def get_core_skills(category: str, sub_category: Optional[str] = None) -> list[str]:
    """직무 핵심 스킬 목록 조회"""
    profile = _load_skill_profile()
    cat = profile.get("categories", {}).get(category, {})
    if sub_category and sub_category in cat.get("sub_categories", {}):
        return cat["sub_categories"][sub_category].get("core_skills", [])
    return cat.get("core_skills", [])


# ── 스킬 매칭 점수 ──
def calc_skill_score(core_skills: list[str], all_course_keywords: dict[str, list[str]]) -> dict:
    """과목 키워드와 직무 핵심 스킬 매칭률 계산"""
    if not core_skills:
        return {"skill_score": 0.0, "covered": [], "uncovered": core_skills, "coverage_detail": []}

    all_keywords = set()
    for keywords in all_course_keywords.values():
        all_keywords.update([k.lower() for k in keywords])

    covered = []
    coverage_detail = []
    for skill in core_skills:
        is_covered = any(skill.lower() in kw or kw in skill.lower() for kw in all_keywords)
        covered_by = [
            cn for cn, kws in all_course_keywords.items()
            if any(skill.lower() in k.lower() or k.lower() in skill.lower() for k in kws)
        ]
        coverage_detail.append({"skill": skill, "covered_by": covered_by})
        if is_covered:
            covered.append(skill)

    skill_score = round((len(covered) / len(core_skills)) * 100, 2)
    uncovered = [s for s in core_skills if s not in covered]
    return {
        "skill_score": skill_score,
        "covered": covered,
        "uncovered": uncovered,
        "coverage_detail": coverage_detail,
    }


# ── 학년 충돌 체크 ──
def check_grade_conflicts(course: Course, student_grade: int) -> Optional[dict]:
    """학년 적합성 체크"""
    gl = course.grade_level or 0
    if gl == 0:
        return None
    diff = gl - student_grade
    if diff >= GRADE_HIGH_DIFF:
        return {
            "type": "grade_too_high",
            "reason": f"{student_grade}학년 학생이 {gl}학년 권장 과목을 수강신청했습니다. 선행 지식 부족으로 학습에 어려움이 예상됩니다.",
            "severity": "경고",
        }
    if diff <= GRADE_LOW_DIFF:
        return {
            "type": "grade_too_low",
            "reason": f"{student_grade}학년 학생이 {gl}학년 권장 과목을 수강신청했습니다. 이미 습득한 내용과 중복될 수 있습니다.",
            "severity": "주의",
        }
    return None


# ── 선수과목 체크 ──
def check_prerequisites(db: Session, course_id: str, completed: set[str]) -> tuple[bool, list[str]]:
    prereqs = (
        db.query(CoursePrerequisite)
        .filter(CoursePrerequisite.course_id == course_id)
        .all()
    )
    missing = [p.prerequisite_id for p in prereqs if p.prerequisite_id not in completed]
    return len(missing) == 0, missing


# ── 판정 ──
def classify_verdict(embedding_sim: float) -> str:
    """임베딩 유사도 기반 판정 (알고리즘 팀 2차 수정)"""
    if embedding_sim >= SYNERGY_THRESHOLD:
        return "시너지"
    if embedding_sim >= CONFLICT_THRESHOLD:
        return "보통"
    return "충돌"


def friendly_reason(job_subcategory: str, similarity: float) -> str:
    """점수대별 차등 추천 사유 (알고리즘 팀 추가)"""
    pct = int(similarity * 100)
    if pct >= 70:
        return f"'{job_subcategory}' 직무와 매우 밀접하게 연관 — 강력 추천"
    elif pct >= 60:
        return f"'{job_subcategory}' 직무 준비에 직접 도움 — 수강 권장"
    elif pct >= 50:
        return f"'{job_subcategory}' 직무 관련성 높아 경쟁력 향상에 기여"
    else:
        return f"'{job_subcategory}' 직무와 어느 정도 연관"


def build_reason(
    verdict: str,
    course_name: str,
    job_subcategory: str,
    embedding_sim: float,
    grade_conflict: Optional[dict] = None,
) -> str:
    parts = []
    pct = int(embedding_sim * 100)
    if verdict == "시너지":
        grade_label = '매우 높음' if pct >= 60 else ('높음' if pct >= 50 else '보통 이상')
        parts.append(
            f"'{job_subcategory}' 직무와의 관련성이 {grade_label}입니다 "
            f"({pct}% 일치). 직무 준비에 직접적으로 도움이 됩니다."
        )
    elif verdict == "보통":
        parts.append(f"{job_subcategory} 직무에 간접적으로 도움이 될 수 있는 과목입니다")
    else:
        parts.append(f"{job_subcategory} 직무와 직접적 관련성이 낮습니다 (연관도 {embedding_sim:.2f})")

    if grade_conflict:
        parts.append(f"[{grade_conflict['severity']}] {grade_conflict['reason']}")

    return " | ".join(parts)


# ── 메인 분석 ──
def run_analysis(db: Session, req: AnalyzeRequest) -> AnalyzeResponse:
    # 직무 카테고리 조회
    job_cat = (
        db.query(JobCategory)
        .filter(JobCategory.subcategory == req.job_subcategory)
        .first()
    )
    job_category_name = job_cat.category if job_cat else "미분류"
    core_skills = get_core_skills(job_category_name, req.job_subcategory)

    completed_set = set(req.completed_courses)
    all_selected = set(req.completed_courses + req.planned_courses)

    # 전체 과목 키워드 수집 (스킬 매칭용)
    all_course_keywords: dict[str, list[str]] = {}
    for cid in req.planned_courses:
        course = db.query(Course).filter(Course.id == cid).first()
        if course and course.keywords:
            all_course_keywords[course.course_name] = course.keywords

    # 스킬 매칭 점수
    skill_info = calc_skill_score(core_skills, all_course_keywords)

    results: list[CourseResult] = []
    summary = AnalyzeSummary()

    for course_id in req.planned_courses:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            continue

        # 1) 임베딩 유사도
        embedding_sim = get_course_job_similarity(db, course_id, req.job_subcategory)

        # 2) 판정 — 임베딩 유사도 직접 비교 (알고리즘 팀 2차 수정)
        verdict = classify_verdict(embedding_sim)

        # 5) 학년 충돌
        grade_conflict = check_grade_conflicts(course, req.grade)

        # 6) 선수과목 체크
        prereq_ok, missing = check_prerequisites(db, course_id, completed_set)

        # 7) 사유
        reason = build_reason(verdict, course.course_name, req.job_subcategory, embedding_sim, grade_conflict)

        # 요약 집계
        if not prereq_ok:
            summary.선수과목_미충족 += 1
        elif verdict == "시너지":
            summary.시너지 += 1
        elif verdict == "보통":
            summary.보통 += 1
        else:
            summary.충돌 += 1

        results.append(
            CourseResult(
                course_id=course_id,
                course_name=course.course_name,
                similarity_score=round(embedding_sim, 4),
                verdict=verdict,
                reason=reason,
                prerequisite_ok=prereq_ok,
                missing_prerequisites=missing,
            )
        )

    # 추천 과목
    top_courses = get_top_similar_courses(
        db,
        req.job_subcategory,
        exclude_ids=list(all_selected),
        limit=5,
    )
    recommendations = [
        RecommendationOut(
            course_id=c["course_id"],
            course_name=c["course_name"],
            department=c.get("department", ""),
            similarity_score=c["similarity_score"],
            reason=friendly_reason(req.job_subcategory, c["similarity_score"]),
        )
        for c in top_courses
    ]

    return AnalyzeResponse(
        job_category=job_category_name,
        job_subcategory=req.job_subcategory,
        results=results,
        recommendations=recommendations,
        summary=summary,
    )
