"""강의계획서_알고리즘용.json → departments, courses, course_prerequisites 테이블 적재"""
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import psycopg2

DB = dict(
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432"),
    dbname=os.getenv("DB_NAME", "courseguide"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASS", "postgres"),
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "강의계획서_알고리즘용.json")


def main():
    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)

    courses = data["courses"]
    print(f"총 {len(courses)}개 과목 로드")

    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    # 1) departments — 데이터에서 유니크한 학과 추출
    depts = {}
    for c in courses:
        dept_name = c["department"]
        if dept_name not in depts:
            # dept_id를 course_id 앞 부분이나 학과명 기반으로 생성
            dept_id = dept_name.replace(" ", "_")
            depts[dept_name] = dept_id

    for dept_name, dept_id in depts.items():
        cur.execute(
            """INSERT INTO departments (dept_id, dept_name, college)
               VALUES (%s, %s, %s)
               ON CONFLICT (dept_id) DO NOTHING""",
            (dept_id, dept_name, "정보과학대학"),
        )
    conn.commit()
    print(f"학과 {len(depts)}개 적재 완료")

    # 2) courses
    for c in courses:
        dept_id = depts[c["department"]]
        cur.execute(
            """INSERT INTO courses (id, course_name, department, dept_id, grade_level,
                                    credits, category, professor, description_full, keywords)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (id) DO NOTHING""",
            (
                c["course_id"],
                c["course_name"],
                c["department"],
                dept_id,
                c.get("grade_level", 0),
                c.get("credits", 3),
                c.get("category", ""),
                c.get("professor", ""),
                c.get("description_full", ""),
                c.get("keywords", []),
            ),
        )
    conn.commit()
    print(f"과목 {len(courses)}개 적재 완료")

    # 3) course_prerequisites
    prereq_count = 0
    for c in courses:
        for pid in c.get("prerequisite_ids", []):
            if pid:
                cur.execute(
                    """INSERT INTO course_prerequisites (course_id, prerequisite_id)
                       VALUES (%s, %s)
                       ON CONFLICT DO NOTHING""",
                    (c["course_id"], pid),
                )
                prereq_count += 1
    conn.commit()
    print(f"선수과목 관계 {prereq_count}개 적재 완료")

    cur.close()
    conn.close()
    print("과목 데이터 적재 완료!")


if __name__ == "__main__":
    main()
