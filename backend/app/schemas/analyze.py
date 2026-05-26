from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    department: str
    grade: int
    job_subcategory: str
    completed_courses: list[str]
    planned_courses: list[str]


class CourseResult(BaseModel):
    course_id: str
    course_name: str
    similarity_score: float
    verdict: str
    reason: str
    prerequisite_ok: bool
    missing_prerequisites: list[str] = []


class RecommendationOut(BaseModel):
    course_id: str
    course_name: str
    department: str = ""
    similarity_score: float
    reason: str


class AnalyzeSummary(BaseModel):
    시너지: int = 0
    보통: int = 0
    충돌: int = 0
    선수과목_미충족: int = 0


class AnalyzeResponse(BaseModel):
    job_category: str
    job_subcategory: str
    results: list[CourseResult]
    recommendations: list[RecommendationOut]
    summary: AnalyzeSummary
