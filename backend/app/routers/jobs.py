from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.job import JobCategory, JobPosting
from app.schemas.job import JobListResponse, CategoryOut, SubcategoryOut

router = APIRouter(tags=["jobs"])


@router.get("/jobs", response_model=JobListResponse)
def get_jobs(db: Session = Depends(get_db)):
    rows = (
        db.query(
            JobCategory.category,
            JobCategory.subcategory,
            func.count(JobPosting.rec_idx).label("posting_count"),
        )
        .outerjoin(JobPosting, JobPosting.category_id == JobCategory.id)
        .group_by(JobCategory.category, JobCategory.subcategory)
        .order_by(JobCategory.category, JobCategory.subcategory)
        .all()
    )

    cat_map: dict[str, list[SubcategoryOut]] = {}
    for cat, sub, cnt in rows:
        cat_map.setdefault(cat, []).append(
            SubcategoryOut(subcategory=sub, posting_count=cnt)
        )

    categories = [
        CategoryOut(category=cat, subcategories=subs)
        for cat, subs in cat_map.items()
    ]
    return JobListResponse(total_categories=len(categories), categories=categories)
