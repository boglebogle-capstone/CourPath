-- pgvector 불필요 — 유사도를 사전 계산하여 저장

-- 학과 테이블
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    dept_id VARCHAR(50) UNIQUE NOT NULL,
    dept_name VARCHAR(100) NOT NULL,
    college VARCHAR(100)
);

-- 과목 테이블
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    dept_id VARCHAR(50) REFERENCES departments(dept_id),
    grade_level INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 3,
    category VARCHAR(50),
    professor VARCHAR(100),
    description_full TEXT,
    keywords TEXT[]
);

-- 선수과목 관계 테이블
CREATE TABLE IF NOT EXISTS course_prerequisites (
    course_id VARCHAR(20) REFERENCES courses(id),
    prerequisite_id VARCHAR(20) REFERENCES courses(id),
    PRIMARY KEY (course_id, prerequisite_id)
);

-- 직무 카테고리 테이블
CREATE TABLE IF NOT EXISTS job_categories (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100) NOT NULL,
    core_skills TEXT[]
);

-- 채용공고 테이블
CREATE TABLE IF NOT EXISTS job_postings (
    rec_idx VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    company VARCHAR(200),
    skills TEXT[],
    detail_text TEXT,
    search_keyword VARCHAR(100),
    category_id INTEGER REFERENCES job_categories(id)
);

-- 사전 계산된 과목↔직무 유사도 테이블 (pgvector 대체)
CREATE TABLE IF NOT EXISTS course_job_similarity (
    course_id VARCHAR(20) REFERENCES courses(id),
    subcategory VARCHAR(100) NOT NULL,
    similarity REAL NOT NULL,
    PRIMARY KEY (course_id, subcategory)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_courses_dept ON courses(dept_id);
CREATE INDEX IF NOT EXISTS idx_courses_grade ON courses(grade_level);
CREATE INDEX IF NOT EXISTS idx_job_postings_category ON job_postings(category_id);
CREATE INDEX IF NOT EXISTS idx_job_categories_sub ON job_categories(subcategory);
CREATE INDEX IF NOT EXISTS idx_similarity_sub ON course_job_similarity(subcategory);
CREATE INDEX IF NOT EXISTS idx_similarity_score ON course_job_similarity(subcategory, similarity DESC);
