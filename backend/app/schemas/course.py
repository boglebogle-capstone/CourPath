from pydantic import BaseModel


class DepartmentOut(BaseModel):
    dept_id: str
    dept_name: str
    college: str | None = None

    class Config:
        from_attributes = True


class DepartmentListResponse(BaseModel):
    total: int
    departments: list[DepartmentOut]


class CourseOut(BaseModel):
    course_id: str
    course_name: str
    grade_level: int
    credits: int
    category: str | None = None
    professor: str | None = None
    prerequisites: list[str] = []
    keywords: list[str] = []

    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    department: str | None = None
    grade: int | None = None
    total: int
    courses: list[CourseOut]


class AvailableCourseOut(BaseModel):
    course_id: str
    course_name: str
    grade_level: int
    credits: int
    category: str | None = None
    prerequisite_met: bool
    prerequisites: list[str] = []

    class Config:
        from_attributes = True


class AvailableCourseListResponse(BaseModel):
    total: int
    courses: list[AvailableCourseOut]


class PrerequisiteDetail(BaseModel):
    course_id: str
    course_name: str
    met: bool


class MissingPrerequisite(BaseModel):
    course_id: str
    course_name: str


class PrerequisiteCheckResponse(BaseModel):
    course_id: str
    course_name: str
    prerequisite_ok: bool
    prerequisites: list[PrerequisiteDetail]
    missing: list[MissingPrerequisite]
