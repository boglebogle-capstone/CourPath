from sqlalchemy import Column, String, Float
from app.database import Base


class CourseJobSimilarity(Base):
    """사전 계산된 과목↔직무(세부직무) 유사도"""
    __tablename__ = "course_job_similarity"

    course_id = Column(String(20), primary_key=True)
    subcategory = Column(String(100), primary_key=True)
    similarity = Column(Float, nullable=False)
