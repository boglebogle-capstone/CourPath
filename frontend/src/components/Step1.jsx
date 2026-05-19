import React, { useState, useEffect } from 'react';
import jobProfileData from '../data/직무_기술스택_프로필.json';

// 대분류(단과대학) → 소분류(학과) 매핑
const COLLEGE_MAJORS = {
  '경영대학': ['경영학과'],
  '글로벌융합대학': [],
  '미디어스쿨': [],
  '미래융합스쿨': ['AI에듀테크전공', '융합과학수사학과'],
  '반도체·디스플레이공학과': [],
  '사회과학대학': ['사회학과', '심리학과', '광고홍보학과', '법학과', '행정학과'],
  '소프트웨어학부': [],
  '인문대학': ['국어국문학과', '영어영문학과', '일본학과', '중국학과', '사학과', '철학과'],
  '자연과학대학': ['수학과', '생명과학과', '식품영양학과', '간호학과', '의료정보학과', '언어청각학부'],
  '자유전공학부': [],
  '정보과학대학': ['인공지능융합학부', '데이터사이언스학부'],
};

const COLLEGE_LIST = Object.keys(COLLEGE_MAJORS).sort((a, b) => a.localeCompare(b, 'ko'));

export default function Step1({ formData, setFormData, onNext }) {
  const [courseDataReady, setCourseDataReady] = useState(false); // eslint-disable-line no-unused-vars

  const isFormValid =
    formData.major !== '' &&
    formData.grade &&
    formData.grade !== '' &&
    formData.jobCategory !== '' &&
    formData.jobSub !== '';

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (window.COURSE_DATA?.length > 0) { setCourseDataReady(true); clearInterval(checkInterval); }
    }, 100);
    const backupTimeout = setTimeout(() => { setCourseDataReady(true); clearInterval(checkInterval); }, 3000);
    return () => { clearInterval(checkInterval); clearTimeout(backupTimeout); };
  }, []);

  // 대분류 선택 핸들러
  const handleMajorCollege = (e) => {
    const college = e.target.value;
    const subs = COLLEGE_MAJORS[college] || [];
    // 세부전공 없으면 바로 확정
    if (subs.length === 0) {
      setFormData({ ...formData, major: college, majorDetail: college });
    } else {
      setFormData({ ...formData, major: college, majorDetail: '' });
    }
    // 복수전공과 겹치면 초기화
    if (formData.minor === college) {
      setFormData(prev => ({ ...prev, major: college, majorDetail: subs.length === 0 ? college : '', minor: '', minorDetail: '' }));
    }
  };

  const handleMajorDetail = (e) => {
    setFormData({ ...formData, majorDetail: e.target.value });
  };

  const handleMinorCollege = (e) => {
    const college = e.target.value;
    if (!college) {
      setFormData({ ...formData, minor: '', minorDetail: '' });
      return;
    }
    const subs = COLLEGE_MAJORS[college] || [];
    if (subs.length === 0) {
      setFormData({ ...formData, minor: college, minorDetail: college });
    } else {
      setFormData({ ...formData, minor: college, minorDetail: '' });
    }
  };

  const handleMinorDetail = (e) => {
    setFormData({ ...formData, minorDetail: e.target.value });
  };

  const majorSubs = COLLEGE_MAJORS[formData.major] || [];
  const minorSubs = COLLEGE_MAJORS[formData.minor] || [];
  // 복수전공 대분류에서 주전공 제외
  const minorCollegeOptions = COLLEGE_LIST.filter(c => c !== formData.major);

  const categories = Object.keys(jobProfileData.categories || {});
  const subCategories = formData.jobCategory && jobProfileData.categories[formData.jobCategory]
    ? Object.keys(jobProfileData.categories[formData.jobCategory].sub_categories || {})
    : [];

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>1. 기본 정보를 입력해주세요</h2>
        <p style={styles.subtitle}>정확한 분석을 위해 전공과 목표 직무를 선택해주세요.</p>
      </div>

      <div style={styles.formGroup}>
        {/* ── 전공 선택 (대분류 → 소분류 드롭다운) ── */}
        <div style={styles.inputRow}>
          <div style={styles.inputCol}>
            <label style={styles.label}>본전공 (대분류) <span style={styles.required}>*</span></label>
            <select style={styles.select} value={formData.major} onChange={handleMajorCollege}>
              <option value="">단과대학/학부 선택</option>
              {COLLEGE_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={styles.inputCol}>
            <label style={styles.label}>
              본전공 (세부학과)
              {majorSubs.length > 0 && <span style={styles.required}>*</span>}
              {majorSubs.length === 0 && formData.major && <span style={styles.autoTag}>자동 선택됨</span>}
            </label>
            {majorSubs.length > 0 ? (
              <select style={styles.select} value={formData.majorDetail} onChange={handleMajorDetail}>
                <option value="">세부 학과 선택</option>
                {majorSubs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <div style={styles.autoBox}>{formData.major || '대분류를 먼저 선택하세요'}</div>
            )}
          </div>
        </div>

        {/* ── 복수/부전공 선택 ── */}
        <div style={styles.inputRow}>
          <div style={styles.inputCol}>
            <label style={styles.label}>복수/부전공 (대분류) <span style={styles.optional}>(선택)</span></label>
            <select style={styles.select} value={formData.minor} onChange={handleMinorCollege}>
              <option value="">없음</option>
              {minorCollegeOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={styles.inputCol}>
            <label style={styles.label}>
              복수/부전공 (세부학과)
              {minorSubs.length === 0 && formData.minor && <span style={styles.autoTag}>자동 선택됨</span>}
            </label>
            {minorSubs.length > 0 ? (
              <select style={styles.select} value={formData.minorDetail} onChange={handleMinorDetail}>
                <option value="">세부 학과 선택</option>
                {minorSubs.filter(s => s !== formData.majorDetail).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <div style={styles.autoBox}>{formData.minor || '대분류를 먼저 선택하세요'}</div>
            )}
          </div>
        </div>

        {/* ── 학년 선택 ── */}
        <div style={styles.inputCol}>
          <label style={styles.label}>학년 <span style={styles.required}>*</span></label>
          <div style={styles.gradeContainer}>
            {['1학년', '2학년', '3학년', '4학년'].map(grade => {
              const isSelected = formData.grade === grade;
              return (
                <div key={grade} style={{
                  ...styles.gradeCard,
                  border: isSelected ? '2px solid #0d6efd' : '1px solid #dee2e6',
                  backgroundColor: isSelected ? '#f0f7ff' : '#fff',
                  color: isSelected ? '#0d6efd' : '#495057',
                  fontWeight: isSelected ? 'bold' : 'normal'
                }} onClick={() => setFormData({ ...formData, grade })}>
                  {grade}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 목표 직무 선택 ── */}
        <div style={styles.inputRow}>
          <div style={styles.inputCol}>
            <label style={styles.label}>목표 직무 (대분류) <span style={styles.required}>*</span></label>
            <select style={styles.select} value={formData.jobCategory}
              onChange={(e) => setFormData({ ...formData, jobCategory: e.target.value, jobSub: '' })}>
              <option value="">직무를 선택하세요</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={styles.inputCol}>
            <label style={styles.label}>세부 직무 <span style={styles.required}>*</span></label>
            <select style={{ ...styles.select, backgroundColor: formData.jobCategory ? '#fff' : '#f8f9fa', cursor: formData.jobCategory ? 'pointer' : 'not-allowed' }}
              value={formData.jobSub} onChange={(e) => setFormData({ ...formData, jobSub: e.target.value })} disabled={!formData.jobCategory}>
              <option value="">세부 직무를 선택하세요</option>
              {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <button style={{
          ...styles.nextButton,
          backgroundColor: isFormValid ? '#0d6efd' : '#e9ecef',
          color: isFormValid ? '#fff' : '#adb5bd',
          cursor: isFormValid ? 'pointer' : 'not-allowed'
        }} disabled={!isFormValid} onClick={onNext}>
          다음 단계로 &rarr;
        </button>
      </div>
    </div>
  );
}

const styles = {
  header: { marginBottom: '30px', borderBottom: '1px solid #dee2e6', paddingBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#212529', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#6c757d', margin: 0 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '24px' },
  inputRow: { display: 'flex', gap: '20px' },
  inputCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '15px', fontWeight: 'bold', color: '#343a40' },
  required: { color: '#dc3545', marginLeft: '4px' },
  optional: { color: '#adb5bd', marginLeft: '4px', fontWeight: 'normal', fontSize: '13px' },
  autoTag: { color: '#28a745', marginLeft: '6px', fontWeight: 'normal', fontSize: '11px', backgroundColor: '#e6f9ee', padding: '1px 6px', borderRadius: '4px' },
  select: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' },
  autoBox: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '15px', backgroundColor: '#f8f9fa', color: '#868e96' },
  gradeContainer: { display: 'flex', gap: '12px', width: '100%' },
  gradeCard: { flex: 1, padding: '14px 0', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s ease-in-out' },
  footer: { marginTop: '40px', display: 'flex', justifyContent: 'flex-end' },
  nextButton: { padding: '12px 24px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.2s' }
};
