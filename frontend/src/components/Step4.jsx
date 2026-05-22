import React from 'react';

const getCourseId = (c) => c?.course_id ?? c?.course_code ?? c?.['과목코드'] ?? '';

export default function Step4({ formData, onNext, onPrev }) {
  const majorCourses = formData.majorCourses || [];
  const minorCourses = formData.minorCourses || [];
  const otherCourses = formData.otherCourses || [];
  const nextSemesterCourses = formData.nextSemesterCourses || [];
  const totalCompleted = majorCourses.length + minorCourses.length + otherCourses.length;
  const totalCredits = nextSemesterCourses.reduce((sum, c) => sum + (Number(c.credits) || 3), 0);

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>4. 입력 사항을 확인해주세요</h2>
        <p style={styles.subtitle}>아래 내용이 맞는지 확인 후 분석을 실행해주세요. 수정이 필요하면 이전 단계로 돌아갈 수 있습니다.</p>
      </div>

      <div style={styles.grid}>
        {/* 기본 정보 */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>기본 정보</h3>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>본전공</span>
            <span style={styles.infoValue}>{formData.major || '-'}</span>
          </div>
          {formData.minor && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>복수/부전공</span>
              <span style={styles.infoValue}>{formData.minor}</span>
            </div>
          )}
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>학년</span>
            <span style={styles.infoValue}>{formData.grade || '-'}</span>
          </div>
        </div>

        {/* 목표 직무 */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>목표 직무</h3>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>직무 대분류</span>
            <span style={styles.infoValue}>{formData.jobCategory || '-'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>세부 직무</span>
            <span style={{ ...styles.infoValue, color: '#0d6efd', fontWeight: 'bold' }}>{formData.jobSub || '-'}</span>
          </div>
        </div>

        {/* 기이수 과목 */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>기이수 과목 ({totalCompleted}개)</h3>
          {totalCompleted === 0 ? (
            <div style={styles.emptyText}>선택한 기이수 과목이 없습니다.</div>
          ) : (
            <div style={styles.chipContainer}>
              {majorCourses.map(c => (
                <span key={getCourseId(c)} style={{ ...styles.chip, borderColor: '#0d6efd', color: '#0d6efd' }}>
                  {c.course_name}
                </span>
              ))}
              {minorCourses.map(c => (
                <span key={getCourseId(c)} style={{ ...styles.chip, borderColor: '#6f42c1', color: '#6f42c1' }}>
                  {c.course_name}
                </span>
              ))}
              {otherCourses.map(c => (
                <span key={getCourseId(c)} style={{ ...styles.chip, borderColor: '#e67e22', color: '#e67e22' }}>
                  {c.course_name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 수강 예정 과목 */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>수강 예정 과목 ({nextSemesterCourses.length}개 / {totalCredits}학점)</h3>
          {nextSemesterCourses.length === 0 ? (
            <div style={styles.emptyText}>선택한 수강 예정 과목이 없습니다.</div>
          ) : (
            <div style={styles.chipContainer}>
              {nextSemesterCourses.map(c => (
                <span key={getCourseId(c)} style={{ ...styles.chip, borderColor: '#28a745', color: '#28a745' }}>
                  {c.course_name} ({c.credits}학점)
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.footer}>
        <button style={styles.prevButton} onClick={onPrev}>&larr; 이전 단계</button>
        <button style={styles.nextButton} onClick={onNext}>
          분석 실행하기 &rarr;
        </button>
      </div>
    </div>
  );
}

const styles = {
  header: { marginBottom: '24px', borderBottom: '1px solid #dee2e6', paddingBottom: '16px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#212529', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#6c757d', margin: 0, lineHeight: '1.5' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  card: { backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px', padding: '20px' },
  cardTitle: { fontSize: '15px', fontWeight: 'bold', color: '#343a40', margin: '0 0 14px 0', borderBottom: '1px solid #dee2e6', paddingBottom: '10px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f3f5' },
  infoLabel: { fontSize: '14px', color: '#868e96' },
  infoValue: { fontSize: '14px', color: '#212529', fontWeight: '500' },
  emptyText: { fontSize: '13px', color: '#adb5bd', textAlign: 'center', padding: '16px 0' },
  chipContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  chip: { fontSize: '12px', padding: '4px 10px', borderRadius: '14px', border: '1px solid', backgroundColor: '#fff' },
  footer: { marginTop: '30px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #dee2e6', paddingTop: '20px' },
  prevButton: { padding: '12px 20px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#495057', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },
  nextButton: { padding: '12px 28px', borderRadius: '8px', border: 'none', backgroundColor: '#28a745', color: '#fff', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },
};
