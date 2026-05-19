from sqlalchemy import Column, String, Integer, Text, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dept_id = Column(String(50), unique=True, nullable=False)
    dept_name = Column(String(100), nullable=False)
    college = Column(String(100))

    courses = relationship("Course", back_populates="department_rel")


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(20), primary_key=True)
    course_name = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False)
    dept_id = Column(String(50), ForeignKey("departments.dept_id"))
    grade_level = Column(Integer, default=0)
    credits = Column(Integer, default=3)
    category = Column(String(50))
    professor = Column(String(100))
    description_full = Column(Text)
    keywords = Column(ARRAY(String))

    department_rel = relationship("Department", back_populates="courses")
    prerequisites = relationship(
        "CoursePrerequisite",
        back_populates="course",
        foreign_keys="CoursePrerequisite.course_id",
    )


class CoursePrerequisite(Base):
    __tablename__ = "course_prerequisites"

    course_id = Column(String(20), ForeignKey("courses.id"), primary_key=True)
    prerequisite_id = Column(String(20), ForeignKey("courses.id"), primary_key=True)

    course = relationship("Course", foreign_keys=[course_id], back_populates="prerequisites")
    prerequisite = relationship("Course", foreign_keys=[prerequisite_id])
