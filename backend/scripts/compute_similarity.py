"""
알고리즘 팀 기준으로 유사도 사전 계산
- 모델: jhgan/ko-sroberta-multitask (알고리즘 팀 지정)
- L2 정규화 후 cosine similarity
- 과목별 × 세부직무별 평균 유사도 → course_job_similarity 테이블 저장
"""
import json
import os
import sys

import numpy as np
import psycopg2
from sentence_transformers import SentenceTransformer

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

DB = DATABASE_URL or dict(
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432"),
    dbname=os.getenv("DB_NAME", "courseguide"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASS", "postgres"),
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
COURSES_PATH = os.path.join(DATA_DIR, "강의계획서_알고리즘용.json")
JOB_LEARN_PATH = os.path.join(DATA_DIR, "직무_학습데이터.json")

# 알고리즘 팀 지정 모델: "jhgan/ko-sroberta-multitask"
# 다운로드 실패 시 fallback: "snunlp/KR-SBERT-V40K-klueNLI-augSTS"
MODEL_NAME = os.getenv("SBERT_MODEL", "jhgan/ko-sroberta-multitask")
BATCH_SIZE = 64


def l2_normalize(vectors: np.ndarray) -> np.ndarray:
    """L2 정규화 (알고리즘 팀 방식)"""
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1e-9, norms)
    return vectors / norms


def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def main():
    print(f"모델 로딩 중: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    print("모델 로드 완료")

    # 과목 데이터 로드
    with open(COURSES_PATH, encoding="utf-8") as f:
        courses_data = json.load(f)["courses"]

    # 직무 데이터 로드
    with open(JOB_LEARN_PATH, encoding="utf-8") as f:
        jobs_data = json.load(f)

    # 과목 임베딩 생성 (description_full 사용 — 알고리즘 팀 방식)
    print(f"과목 {len(courses_data)}개 임베딩 생성 중...")
    course_texts = [c["description_full"] for c in courses_data]
    course_ids = [c["course_id"] for c in courses_data]
    course_embeddings = l2_normalize(
        model.encode(course_texts, show_progress_bar=True, batch_size=BATCH_SIZE, convert_to_numpy=True)
    )
    print(f"과목 임베딩 완료: shape={course_embeddings.shape}")

    # 세부직무별 평균 임베딩 (L2 정규화)
    print(f"직무 {len(jobs_data)}건 임베딩 생성 중...")
    sub_cat_texts = {}
    for job in jobs_data:
        sub = job["sub_category"]
        text = job.get("text_for_embedding", "") or job.get("title", "")
        sub_cat_texts.setdefault(sub, []).append(text)

    sub_cat_embeddings = {}
    for sub, texts in sub_cat_texts.items():
        vecs = model.encode(texts, show_progress_bar=False, batch_size=BATCH_SIZE, convert_to_numpy=True)
        mean_vec = vecs.mean(axis=0, keepdims=True)
        sub_cat_embeddings[sub] = l2_normalize(mean_vec)[0]

    print(f"세부직무 {len(sub_cat_embeddings)}개 평균 임베딩 생성 완료")

    # 유사도 계산 및 DB 저장
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # 기존 데이터 삭제
    cur.execute("TRUNCATE course_job_similarity")
    conn.commit()

    total = 0
    for i, cid in enumerate(course_ids):
        for sub, job_emb in sub_cat_embeddings.items():
            sim = cosine_similarity(course_embeddings[i], job_emb)
            cur.execute(
                """INSERT INTO course_job_similarity (course_id, subcategory, similarity)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (course_id, subcategory) DO UPDATE SET similarity = EXCLUDED.similarity""",
                (cid, sub, sim),
            )
            total += 1

        if (i + 1) % 100 == 0:
            conn.commit()
            print(f"  {i + 1}/{len(course_ids)} 과목 처리 완료")

    conn.commit()
    print(f"유사도 레코드 {total}개 저장 완료 ({len(course_ids)} x {len(sub_cat_embeddings)})")

    # 통계
    cur.execute("SELECT MIN(similarity), ROUND(AVG(similarity)::numeric, 4), MAX(similarity) FROM course_job_similarity")
    row = cur.fetchone()
    print(f"유사도 통계: min={row[0]}, avg={row[1]}, max={row[2]}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
