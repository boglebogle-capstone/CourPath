import React from 'react';
import jobProfileData from '../data/직무_기술스택_프로필.json';

export default function Step4({ formData, setFormData, onNext, onPrev }) {
  
  // 🎯 직무 대분류 및 세부분류가 빈틈없이 선택되었는지 정밀 유효성 검사
  const isFormValid = formData.jobCategory && formData.jobCategory !== '' && formData.jobSub && formData.jobSub !== '';

  // JSON 데이터로부터 카테고리 추출
  const categories = Object.keys(jobProfileData.categories || {});
  const subCategories = formData.jobCategory && jobProfileData.categories[formData.jobCategory]
    ? Object.keys(jobProfileData.categories[formData.jobCategory].sub_categories || {})
    : [];

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>4. 목표하시는 직무를 선택해주세요</h2>
        <p style={styles.subtitle}>
          선택하신 직무의 핵심 기술 스택과 수강 내역(이수 완료 + 차기 예정)을 종합적으로 대조하여 AI 융합 매칭을 준비합니다.
        </p>
      </div>

      <div style={styles.formGroup}>
        <div style={styles.inputRow}>
          {/* ── 대분류 직무군 선택 ── */}
          <div style={styles.inputCol}>
            <label style={styles.label}>목표 직무군 (대분류) <span style={styles.required}>*</span></label>
            <select
              style={styles.select}
              value={formData.jobCategory ?? ''}
              onChange={(e) => setFormData({ ...formData, jobCategory: e.target.value, jobSub: '' })}
            >
              <option value="">대분류 직무군 선택</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* ── 상세 세부 직무 선택 ── */}
          <div style={styles.inputCol}>
            <label style={styles.label}>상세 세부 직무 <span style={styles.required}>*</span></label>
            <select
              style={{
                ...styles.select,
                backgroundColor: formData.jobCategory ? '#fff' : '#f8f9fa',
                cursor: formData.jobCategory ? 'pointer' : 'not-allowed'
              }}
              value={formData.jobSub ?? ''}
              onChange={(e) => setFormData({ ...formData, jobSub: e.target.value })}
              disabled={!formData.jobCategory}
            >
              <option value="">세부 직무 선택</option>
              {subCategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── 하단 내비게이션 액션 풋터 ── */}
      <div style={styles.footer}>
        <button style={styles.prevButton} onClick={onPrev}>&larr; 이전 단계 (수강 예정 보정)</button>
        <button
          style={{
            ...styles.nextButton,
            backgroundColor: isFormValid ? '#28a745' : '#e9ecef', // 최종 분석 장전 단계이므로 쌈뽕한 그린 컬러 셰이딩
            color: isFormValid ? '#fff' : '#adb5bd',
            cursor: isFormValid ? 'pointer' : 'not-allowed'
          }}
          disabled={!isFormValid}
          onClick={onNext}
        >
          🚀 융합 분석 실행하기
        </button>
      </div>
    </div>
  );
}

/* ──────────── 디자인 레이아웃 스타일 ──────────── */
const styles = {
  header: { marginBottom: '30px', borderBottom: '1px solid #dee2e6', paddingBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#212529', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#6c757d', margin: 0, lineHeight: '1.4' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '30px', padding: '20px 0' },
  inputRow: { display: 'flex', gap: '20px' },
  inputCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '15px', fontWeight: 'bold', color: '#343a40' },
  required: { color: '#dc3545', marginLeft: '4px' },
  select: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '15px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', transition: 'all 0.15s' },
  footer: { marginTop: '50px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #dee2e6', paddingTop: '20px' },
  prevButton: { padding: '12px 20px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#495057', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },
  nextButton: { padding: '12px 28px', borderRadius: '8px', border: 'none', fontSize: '15px', fontWeight: 'bold', transition: 'all 0.2s' }
};