"""
유사도 조회 서비스
- 로컬(pgvector 미설치): course_job_similarity 테이블에서 사전 계산 값 조회
- 배포(pgvector 설치): 실시간 cosine similarity 계산 가능
"""
import numpy as np
from sqlalchemy.orm import Session
from app.models.embedding import CourseJobSimilarity


def cosine_similarity(a: list, b: list) -> float:
    """정규화된 벡터면 내적 = 코사인 유사도"""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom < 1e-9:
        return 0.0
    return float(np.dot(va, vb) / denom)


def mean_embedding(embeddings: list) -> list:
    """여러 임베딩의 평균 벡터 (L2 정규화)"""
    if not embeddings:
        return []
    arr = np.array(embeddings, dtype=np.float32)
    mean = arr.mean(axis=0)
    norm = np.linalg.norm(mean)
    return (mean / norm if norm > 1e-9 else mean).tolist()


def get_course_job_similarity(db: Session, course_id: str, job_subcategory: str) -> float:
    """사전 계산된 과목↔세부직무 유사도 조회"""
    row = (
        db.query(CourseJobSimilarity)
        .filter(
            CourseJobSimilarity.course_id == course_id,
            CourseJobSimilarity.subcategory == job_subcategory,
        )
        .first()
    )
    return float(row.similarity) if row else 0.0


def get_top_similar_courses(
    db: Session,
    job_subcategory: str,
    exclude_ids: list[str],
    limit: int = 5,
) -> list[dict]:
    """유사도 상위 N개 과목 조회 (추천용)"""
    q = (
        db.query(CourseJobSimilarity)
        .filter(CourseJobSimilarity.subcategory == job_subcategory)
    )
    if exclude_ids:
        q = q.filter(~CourseJobSimilarity.course_id.in_(exclude_ids))
    rows = q.order_by(CourseJobSimilarity.similarity.desc()).limit(limit).all()

    from app.models.course import Course
    DEPT_RENAME = {"소프트웨어학부": "정보과학대학"}
    results = []
    for r in rows:
        course = db.query(Course).filter(Course.id == r.course_id).first()
        dept = course.department if course else ""
        dept = DEPT_RENAME.get(dept, dept)
        results.append({
            "course_id": r.course_id,
            "course_name": course.course_name if course else r.course_id,
            "department": dept,
            "similarity_score": round(r.similarity, 4),
        })
    return results
