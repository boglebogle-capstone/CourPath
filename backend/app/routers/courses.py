from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.course import Course, CoursePrerequisite, Department
from app.schemas.course import (
    CourseListResponse,
    CourseOut,
    AvailableCourseListResponse,
    AvailableCourseOut,
    PrerequisiteCheckResponse,
    PrerequisiteDetail,
    MissingPrerequisite,
)

router = APIRouter(tags=["courses"])


def _get_prerequisite_ids(db: Session, course_id: str) -> list[str]:
    prereqs = (
        db.query(CoursePrerequisite.prerequisite_id)
        .filter(CoursePrerequisite.course_id == course_id)
        .all()
    )
    return [p[0] for p in prereqs]


@router.get("/courses", response_model=CourseListResponse)
def get_courses(
    dept: str = Query(..., description="학과 ID (예: SW_AI)"),
    grade: int | None = Query(None, description="학년 (1~4), 미지정 시 전체"),
    db: Session = Depends(get_db),
):
    q = db.query(Course).filter(Course.dept_id == dept)
    if grade is not None:
        q = q.filter(Course.grade_level == grade)
    courses = q.order_by(Course.grade_level, Course.course_name).all()

    dept_obj = db.query(Department).filter(Department.dept_id == dept).first()
    dept_name = dept_obj.dept_name if dept_obj else dept

    items = [
        CourseOut(
            course_id=c.id,
            course_name=c.course_name,
            grade_level=c.grade_level,
            credits=c.credits,
            category=c.category,
            professor=c.professor,
            prerequisites=_get_prerequisite_ids(db, c.id),
            keywords=c.keywords or [],
        )
        for c in courses
    ]
    return CourseListResponse(department=dept_name, grade=grade, total=len(items), courses=items)


@router.get("/courses/available", response_model=AvailableCourseListResponse)
def get_available_courses(
    dept: str = Query(..., description="학과 ID"),
    completed: str = Query(..., description="이수 완료 과목 ID (쉼표 구분)"),
    grade: int | None = Query(None, description="학년 필터"),
    db: Session = Depends(get_db),
):
    completed_set = set(completed.split(",")) if completed else set()

    q = db.query(Course).filter(Course.dept_id == dept)
    if grade is not None:
        q = q.filter(Course.grade_level == grade)
    all_courses = q.order_by(Course.grade_level, Course.course_name).all()

    items: list[AvailableCourseOut] = []
    for c in all_courses:
        if c.id in completed_set:
            continue
        prereq_ids = _get_prerequisite_ids(db, c.id)
        prereq_met = all(pid in completed_set for pid in prereq_ids)
        if not prereq_met:
            continue
        items.append(
            AvailableCourseOut(
                course_id=c.id,
                course_name=c.course_name,
                grade_level=c.grade_level,
                credits=c.credits,
                category=c.category,
                prerequisite_met=True,
                prerequisites=prereq_ids,
            )
        )

    return AvailableCourseListResponse(total=len(items), courses=items)


@router.get("/prerequisites/{course_id}", response_model=PrerequisiteCheckResponse)
def check_prerequisites(
    course_id: str,
    completed: str = Query(..., description="이수 완료 과목 ID (쉼표 구분)"),
    db: Session = Depends(get_db),
):
    completed_set = set(completed.split(",")) if completed else set()
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        return PrerequisiteCheckResponse(
            course_id=course_id,
            course_name="알 수 없음",
            prerequisite_ok=True,
            prerequisites=[],
            missing=[],
        )

    prereq_ids = _get_prerequisite_ids(db, course_id)
    details: list[PrerequisiteDetail] = []
    missing: list[MissingPrerequisite] = []

    for pid in prereq_ids:
        prereq_course = db.query(Course).filter(Course.id == pid).first()
        p_name = prereq_course.course_name if prereq_course else pid
        met = pid in completed_set
        details.append(PrerequisiteDetail(course_id=pid, course_name=p_name, met=met))
        if not met:
            missing.append(MissingPrerequisite(course_id=pid, course_name=p_name))

    return PrerequisiteCheckResponse(
        course_id=course_id,
        course_name=course.course_name,
        prerequisite_ok=len(missing) == 0,
        prerequisites=details,
        missing=missing,
    )
