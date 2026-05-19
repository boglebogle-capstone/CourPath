from pydantic import BaseModel


class SubcategoryOut(BaseModel):
    subcategory: str
    posting_count: int


class CategoryOut(BaseModel):
    category: str
    subcategories: list[SubcategoryOut]


class JobListResponse(BaseModel):
    total_categories: int
    categories: list[CategoryOut]
