from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.course import Department
from app.schemas.course import DepartmentListResponse, DepartmentOut

router = APIRouter(tags=["departments"])


@router.get("/departments", response_model=DepartmentListResponse)
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).order_by(Department.college, Department.dept_name).all()
    items = [
        DepartmentOut(
            dept_id=d.dept_id,
            dept_name=d.dept_name,
            college=d.college,
        )
        for d in depts
    ]
    return DepartmentListResponse(total=len(items), departments=items)
