"""
로컬 PostgreSQL DB의 데이터를 SQL INSERT 문으로 덤프
→ backend/sql/seed.sql 생성
→ Render 배포 시 이 파일로 데이터 로딩 (sentence-transformers 불필요)
"""
import os
import sys
import psycopg2

DB = dict(
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432"),
    dbname=os.getenv("DB_NAME", "courseguide"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASS", "postgres"),
)

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "sql", "seed.sql")

# 덤프 대상 테이블 순서 (FK 의존성 순)
TABLES = [
    "departments",
    "courses",
    "course_prerequisites",
    "job_categories",
    "job_postings",
    "course_job_similarity",
]


def escape_val(val):
    """SQL 값 이스케이프"""
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, list):
        # PostgreSQL 배열 리터럴
        inner = ",".join(f'"{str(v)}"' for v in val)
        return f"'{{{inner}}}'"
    s = str(val).replace("'", "''")
    return f"'{s}'"


def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    lines = ["-- CourPath seed data (auto-generated)\n"]
    lines.append("-- 이 파일은 dump_seed_data.py로 생성되었습니다\n")
    lines.append("-- Render 배포 시 schema.sql 이후 실행\n\n")

    for table in TABLES:
        cur.execute(f"SELECT * FROM {table}")
        rows = cur.fetchall()
        col_names = [desc[0] for desc in cur.description]

        if not rows:
            lines.append(f"-- {table}: 0 rows\n\n")
            continue

        lines.append(f"-- {table}: {len(rows)} rows\n")

        for row in rows:
            vals = []
            for val in row:
                vals.append(escape_val(val))
            cols_str = ", ".join(col_names)
            vals_str = ", ".join(vals)
            lines.append(
                f"INSERT INTO {table} ({cols_str}) VALUES ({vals_str}) ON CONFLICT DO NOTHING;\n"
            )
        lines.append("\n")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.writelines(lines)

    cur.close()
    conn.close()
    print(f"seed.sql 생성 완료: {OUTPUT_PATH}")
    print(f"총 {sum(1 for l in lines if l.startswith('INSERT'))}개 INSERT 문")


if __name__ == "__main__":
    main()
