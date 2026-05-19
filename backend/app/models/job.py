from sqlalchemy import Column, String, Integer, Text, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from app.database import Base


class JobCategory(Base):
    __tablename__ = "job_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100), nullable=False)
    core_skills = Column(ARRAY(String))

    postings = relationship("JobPosting", back_populates="job_category")


class JobPosting(Base):
    __tablename__ = "job_postings"

    rec_idx = Column(String(50), primary_key=True)
    title = Column(String(500), nullable=False)
    company = Column(String(200))
    skills = Column(ARRAY(String))
    detail_text = Column(Text)
    search_keyword = Column(String(100))
    category_id = Column(Integer, ForeignKey("job_categories.id"))

    job_category = relationship("JobCategory", back_populates="postings")
