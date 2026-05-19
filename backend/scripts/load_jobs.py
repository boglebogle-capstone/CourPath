"""saramin_jobs_final.json + 직무_기술스택_프로필.json + 직무_학습데이터.json → job_categories, job_postings 적재"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import psycopg2

DB = dict(
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432"),
    dbname=os.getenv("DB_NAME", "courseguide"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASS", "postgres"),
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
JOBS_PATH = os.path.join(DATA_DIR, "saramin_jobs_final.json")
PROFILE_PATH = os.path.join(DATA_DIR, "직무_기술스택_프로필.json")
LEARN_PATH = os.path.join(DATA_DIR, "직무_학습데이터.json")


def main():
    with open(JOBS_PATH, encoding="utf-8") as f:
        jobs_data = json.load(f)
    with open(PROFILE_PATH, encoding="utf-8") as f:
        profile_data = json.load(f)
    with open(LEARN_PATH, encoding="utf-8") as f:
        learn_data = json.load(f)

    # rec_idx → sub_category 매핑 (학습데이터에서 가져옴)
    rec_to_sub = {}
    for item in learn_data:
        rec_to_sub[str(item["rec_idx"])] = item.get("sub_category", "")

    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # 1) job_categories
    cat_id_map = {}  # (category, subcategory) -> id
    for category, cat_info in profile_data.get("categories", {}).items():
        for subcategory, sub_info in cat_info.get("sub_categories", {}).items():
            core_skills = sub_info.get("core_skills", [])
            cur.execute(
                """INSERT INTO job_categories (category, subcategory, core_skills)
                   VALUES (%s, %s, %s)
                   RETURNING id""",
                (category, subcategory, core_skills),
            )
            cat_id = cur.fetchone()[0]
            cat_id_map[(category, subcategory)] = cat_id

    conn.commit()
    print(f"직무 카테고리 {len(cat_id_map)}개 적재 완료")

    # 2) job_postings
    posting_count = 0
    for category, postings in jobs_data.items():
        for p in postings:
            rec_idx = str(p["rec_idx"])
            sub_category = rec_to_sub.get(rec_idx, "")

            # category_id 찾기
            cat_id = cat_id_map.get((category, sub_category))
            if cat_id is None:
                # 같은 대분류의 첫 번째 서브카테고리로 fallback
                for (cat, sub), cid in cat_id_map.items():
                    if cat == category:
                        cat_id = cid
                        break

            cur.execute(
                """INSERT INTO job_postings (rec_idx, title, company, skills, detail_text,
                                            search_keyword, category_id)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (rec_idx) DO NOTHING""",
                (
                    rec_idx,
                    p.get("title", ""),
                    p.get("company", ""),
                    p.get("skills", []),
                    p.get("detail_text", ""),
                    sub_category,
                    cat_id,
                ),
            )
            posting_count += 1

    conn.commit()
    print(f"채용공고 {posting_count}개 적재 완료")

    cur.close()
    conn.close()
    print("직무 데이터 적재 완료!")


if __name__ == "__main__":
    main()
