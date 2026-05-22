import React, { useState, useEffect } from 'react';
import jobProfileData from '../data/직무_기술스택_프로필.json';

// 단과대학(대분류) 목록
const COLLEGE_LIST = [
  '경영대학',
  '글로벌융합대학',
  '미디어스쿨',
  '미래융합스쿨',
  '반도체·디스플레이공학과',
  '사회과학대학',
  '소프트웨어학부',
  '인문대학',
  '자연과학대학',
  '자유전공학부',
  '정보과학대학',
].sort((a, b) => a.localeCompare(b, 'ko'));

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

  // 주전공 선택 핸들러
  const handleMajor = (e) => {
    const college = e.target.value;
    setFormData({ ...formData, major: college, majorDetail: college });
  };

  // 복수전공 선택 핸들러 (같은 단과대학도 허용)
  const handleMinor = (e) => {
    const college = e.target.value;
    if (!college) {
      setFormData({ ...formData, minor: '', minorDetail: '' });
      return;
    }
    setFormData({ ...formData, minor: college, minorDetail: college });
  };

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
        {/* -- 전공 선택 (대분류만) -- */}
        <div style={styles.inputRow}>
          <div style={styles.inputCol}>
            <label style={styles.label}>본전공 (단과대학/학부) <span style={styles.required}>*</span></label>
            <select style={styles.select} value={formData.major} onChange={handleMajor}>
              <option value="">단과대학/학부 선택</option>
              {COLLEGE_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={styles.inputCol}>
            <label style={styles.label}>복수/부전공 (단과대학/학부) <span style={styles.optional}>(선택)</span></label>
            <select style={styles.select} value={formData.minor} onChange={handleMinor}>
              <option value="">없음</option>
              {COLLEGE_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {formData.minor && formData.minor === formData.major && (
              <span style={styles.sameNote}>본전공과 같은 단과대학입니다. 과목 선택 시 구분됩니다.</span>
            )}
          </div>
        </div>

        {/* -- 학년 선택 -- */}
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

        {/* -- 목표 직무 선택 -- */}
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
  sameNote: { fontSize: '11px', color: '#fd7e14', marginTop: '4px' },
  select: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' },
  gradeContainer: { display: 'flex', gap: '12px', width: '100%' },
  gradeCard: { flex: 1, padding: '14px 0', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s ease-in-out' },
  footer: { marginTop: '40px', display: 'flex', justifyContent: 'flex-end' },
  nextButton: { padding: '12px 24px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.2s' }
};
