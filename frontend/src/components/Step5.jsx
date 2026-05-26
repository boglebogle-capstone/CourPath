import React, { useState, useEffect, useMemo, useRef } from 'react';

const getCourseId = (c) => c?.id ?? c?.course_id ?? c?.course_code ?? '';

export default function Step5({ formData, onPrev, onRestart }) {
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);

  const courseIdToName = useMemo(() => {
    const map = {};
    const allCourses = [
      ...(formData.majorCourses || []),
      ...(formData.minorCourses || []),
      ...(formData.otherCourses || []),
      ...(formData.nextSemesterCourses || []),
    ];
    allCourses.forEach(c => {
      const id = getCourseId(c);
      if (id && c.course_name) map[id] = c.course_name;
    });
    if (window.COURSE_DATA) {
      window.COURSE_DATA.forEach(c => {
        const id = c.course_id ?? c.course_code ?? '';
        if (id && c.course_name) map[id] = c.course_name;
      });
    }
    return map;
  }, [formData]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const majorCourses = formData.majorCourses || [];
        const minorCourses = formData.minorCourses || [];
        const otherCourses = formData.otherCourses || [];
        const nextSemesterCourses = formData.nextSemesterCourses || [];
        const gradeNum = parseInt(String(formData.grade).replace(/[^0-9]/g, '')) || 3;
        const body = {
          department: formData.major,
          grade: gradeNum,
          job_subcategory: formData.jobSub,
          completed_courses: [...majorCourses, ...minorCourses, ...otherCourses].map(c => getCourseId(c)).filter(Boolean),
          planned_courses: nextSemesterCourses.map(c => getCourseId(c)).filter(Boolean),
        };
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`서버 오류 (${response.status}): ${errText}`);
        }
        const data = await response.json();
        setResultData(data);
      } catch (err) {
        console.error('분석 요청 실패:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [formData]);

  const prereqToName = (prereqId) => courseIdToName[prereqId] || prereqId;

  // 결과 페이지 저장 기능
  const handleSave = () => {
    const el = resultRef.current;
    if (!el) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>CourPath 분석 결과</title><style>body{font-family:sans-serif;max-width:900px;margin:20px auto;padding:20px;color:#212529}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #dee2e6;padding:10px;text-align:left;font-size:13px}th{background:#f8f9fa;font-weight:bold}.synergy{color:#28a745}.normal{color:#fd7e14}.conflict{color:#dc3545}</style></head><body>${el.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CourPath_분석결과_${formData.jobSub || 'result'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={st.loadingBox}>
        <div style={st.spinner}></div>
        <h3 style={st.loadingText}>AI 매칭 분석 중...</h3>
        <p style={st.loadingSub}>수강 내역과 목표 직무의 연관성을 분석하고 있습니다.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={st.loadingBox}>
        <h3 style={{ ...st.loadingText, color: '#dc3545' }}>분석 실패</h3>
        <p style={st.loadingSub}>{error}</p>
        <button style={st.prevBtn} onClick={onPrev}>&larr; 이전 단계로 돌아가기</button>
      </div>
    );
  }

  const { job_category, job_subcategory, results, recommendations, summary } = resultData;

  const synergyResults = results.filter(r => r.verdict === '시너지');
  const conflictResults = results.filter(r => r.verdict === '충돌');
  const prereqFailed = results.filter(r => !r.prerequisite_ok);

  const totalPlanned = (formData.nextSemesterCourses || []).reduce((sum, c) => sum + (Number(c.credits) || 3), 0);

  const getOverallMessage = () => {
    if (summary.충돌 === 0 && summary.선수과목_미충족 === 0) return '우수한 수강 설계 - 직무 연관성이 높습니다!';
    if (summary.충돌 > summary.시너지) return '주의 필요 - 직무 연관성이 낮은 과목이 다수 포함되어 있습니다.';
    return '일부 조정 권장 - 전반적으로 양호하나 개선할 수 있습니다.';
  };

  const verdictColor = (v) => v === '시너지' ? '#28a745' : v === '보통' ? '#fd7e14' : '#dc3545';
  const verdictBg = (v) => v === '시너지' ? '#f0fff4' : v === '보통' ? '#fff8f0' : '#fff5f5';

  const cleanReason = (reason) => {
    return reason
      .replace(/임베딩\s*(유사도)?/g, '직무 연관도')
      .replace(/유사도/g, '연관도');
  };

  return (
    <div>
      <div ref={resultRef}>
        <div style={st.header}>
          <h2 style={st.title}>5. AI 분석 결과</h2>
          <p style={st.subtitle}>
            [{job_category} &rarr; {job_subcategory}] 직무 기준으로 수강 이력과 예정 과목을 분석한 결과입니다.
          </p>
        </div>

        {/* 종합 판정 요약 */}
        <div style={{
          ...st.summaryBanner,
          backgroundColor: summary.충돌 > 0 ? '#fff5f5' : '#f0f9ff',
          borderColor: summary.충돌 > 0 ? '#ffc1c1' : '#b2dfff'
        }}>
          <div style={st.bannerLeft}>
            <div style={st.bannerStatus}>{getOverallMessage()}</div>
            <div style={st.bannerMeta}>
              다음 학기 설계 학점: <span style={{ fontWeight: 'bold', color: '#0d6efd' }}>{totalPlanned}학점</span>
              {' / '}분석 과목 수: <span style={{ fontWeight: 'bold' }}>{results.length}개</span>
            </div>
          </div>
          <div style={st.bannerRight}>
            <div style={{ ...st.scoreTag, borderColor: '#28a745' }}>
              시너지 <span style={{ color: '#28a745', fontWeight: 'bold' }}>{summary.시너지}</span>
            </div>
            <div style={{ ...st.scoreTag, borderColor: '#fd7e14' }}>
              보통 <span style={{ color: '#fd7e14', fontWeight: 'bold' }}>{summary.보통}</span>
            </div>
            <div style={{ ...st.scoreTag, borderColor: '#dc3545' }}>
              충돌 <span style={{ color: '#dc3545', fontWeight: 'bold' }}>{summary.충돌}</span>
            </div>
            {summary.선수과목_미충족 > 0 && (
              <div style={{ ...st.scoreTag, borderColor: '#6f42c1' }}>
                선수과목 미충족 <span style={{ color: '#6f42c1', fontWeight: 'bold' }}>{summary.선수과목_미충족}</span>
              </div>
            )}
          </div>
        </div>

        {/* 예정 과목별 상세 분석 */}
        <div style={{ ...st.card, marginBottom: '20px' }}>
          <h3 style={st.cardTitle}>예정 과목별 직무 매칭 상세 분석</h3>
          <table style={st.table}>
            <thead>
              <tr style={st.thRow}>
                <th style={st.th}>과목명</th>
                <th style={st.th}>직무 연관도</th>
                <th style={st.th}>판정</th>
                <th style={st.th}>선수과목</th>
                <th style={st.th}>분석 사유</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx} style={st.tr}>
                  <td style={{ ...st.td, fontWeight: '600' }}>{r.course_name}</td>
                  <td style={{ ...st.td, color: '#0d6efd', fontWeight: 'bold' }}>
                    {(r.similarity_score * 100).toFixed(1)}%
                  </td>
                  <td style={st.td}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                      color: verdictColor(r.verdict), backgroundColor: verdictBg(r.verdict),
                      border: `1px solid ${verdictColor(r.verdict)}30`
                    }}>
                      {r.verdict}
                    </span>
                  </td>
                  <td style={st.td}>
                    {r.prerequisite_ok
                      ? <span style={{ color: '#28a745', fontSize: '13px' }}>충족</span>
                      : <span style={{ color: '#dc3545', fontSize: '12px' }}>미충족: {r.missing_prerequisites.map(prereqToName).join(', ')}</span>
                    }
                  </td>
                  <td style={{ ...st.td, color: '#6c757d', fontSize: '13px', maxWidth: '300px' }}>{cleanReason(r.reason)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={st.grid2Col}>
          {/* 시너지 과목 */}
          <div style={st.card}>
            <h3 style={st.cardTitle}>시너지 과목 (직무 연관성 높음)</h3>
            <div style={st.listBox}>
              {synergyResults.length === 0 ? (
                <div style={st.emptyText}>시너지 판정된 과목이 없습니다.</div>
              ) : (
                synergyResults.map((r, i) => (
                  <div key={i} style={st.synergyItem}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#22543d' }}>{r.course_name}</div>
                      <div style={{ fontSize: '12px', color: '#38a169', marginTop: '2px' }}>
                        연관도 {(r.similarity_score * 100).toFixed(1)}% - {cleanReason(r.reason).split('|')[0].trim()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 충돌/주의 과목 */}
          <div style={st.card}>
            <h3 style={st.cardTitle}>충돌/주의 과목</h3>
            <div style={st.listBox}>
              {conflictResults.length === 0 && prereqFailed.length === 0 ? (
                <div style={st.emptyText}>충돌 항목이 없습니다.</div>
              ) : (
                <>
                  {conflictResults.map((r, i) => (
                    <div key={`c-${i}`} style={st.dangerItem}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#c53030' }}>{r.course_name}</div>
                        <div style={{ fontSize: '12px', color: '#e53e3e', marginTop: '2px' }}>{cleanReason(r.reason)}</div>
                      </div>
                    </div>
                  ))}
                  {prereqFailed.map((r, i) => (
                    <div key={`p-${i}`} style={{ ...st.dangerItem, borderLeftColor: '#6f42c1', backgroundColor: '#f8f5ff' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#553c9a' }}>{r.course_name}</div>
                        <div style={{ fontSize: '12px', color: '#805ad5', marginTop: '2px' }}>
                          선수과목 미충족: {r.missing_prerequisites.map(prereqToName).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 추천 과목 - 단과대 표시 추가 */}
        <div style={{ ...st.card, marginTop: '20px' }}>
          <h3 style={st.cardTitle}>'{job_subcategory}' 직무 맞춤 추천 과목 (TOP {recommendations.length})</h3>
          <p style={{ fontSize: '13px', color: '#6c757d', margin: '0 0 12px 0' }}>
            이수 완료 및 예정 과목을 제외한 미수강 과목 중, 목표 직무와 연관도가 가장 높은 과목입니다.
          </p>
          {recommendations.length === 0 ? (
            <div style={st.emptyText}>추천 가능한 과목이 없습니다.</div>
          ) : (
            <table style={st.table}>
              <thead>
                <tr style={st.thRow}>
                  <th style={st.th}>순위</th>
                  <th style={st.th}>추천 과목명</th>
                  <th style={st.th}>소속</th>
                  <th style={st.th}>직무 연관도</th>
                  <th style={st.th}>추천 근거</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rc, idx) => (
                  <tr key={idx} style={st.tr}>
                    <td style={{ ...st.td, fontWeight: 'bold', color: '#0d6efd' }}>{idx + 1}위</td>
                    <td style={{ ...st.td, fontWeight: '600' }}>{rc.course_name}</td>
                    <td style={st.td}>
                      {rc.department && (
                        <span style={{ backgroundColor: '#e8f4fd', color: '#0d6efd', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                          {rc.department}
                        </span>
                      )}
                    </td>
                    <td style={{ ...st.td, color: '#28a745', fontWeight: 'bold' }}>
                      {(rc.similarity_score * 100).toFixed(1)}%
                    </td>
                    <td style={{ ...st.td, color: '#6c757d', fontSize: '13px' }}>{cleanReason(rc.reason)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={st.footer}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={st.restartBtn} onClick={onRestart}>처음부터 시작</button>
          <button style={st.prevBtn} onClick={onPrev}>&larr; 이전 단계</button>
        </div>
        <button style={st.saveBtn} onClick={handleSave}>결과 저장하기</button>
      </div>
    </div>
  );
}

const st = {
  header: { marginBottom: '24px', borderBottom: '1px solid #dee2e6', paddingBottom: '16px' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#212529', margin: '0 0 6px 0' },
  subtitle: { fontSize: '14px', color: '#6c757d', margin: 0 },

  loadingBox: { textAlign: 'center', padding: '100px 20px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px dashed #ced4da' },
  spinner: { width: '45px', height: '45px', border: '5px solid #e9ecef', borderTop: '5px solid #0d6efd', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' },
  loadingText: { fontSize: '18px', fontWeight: 'bold', color: '#343a40', margin: '0 0 8px 0' },
  loadingSub: { fontSize: '13px', color: '#868e96', margin: 0 },

  summaryBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderRadius: '10px', border: '1px solid', marginBottom: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', flexWrap: 'wrap', gap: '12px' },
  bannerLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
  bannerStatus: { fontSize: '18px', fontWeight: 'bold', color: '#212529' },
  bannerMeta: { fontSize: '13px', color: '#495057' },
  bannerRight: { display: 'flex', gap: '10px', fontSize: '13px', fontWeight: 'bold', flexWrap: 'wrap' },
  scoreTag: { backgroundColor: '#fff', padding: '6px 14px', borderRadius: '6px', border: '1px solid #dee2e6' },

  grid2Col: { display: 'flex', gap: '20px', width: '100%' },
  card: { flex: 1, minWidth: 0, backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' },
  cardTitle: { fontSize: '16px', fontWeight: 'bold', color: '#212529', margin: '0 0 12px 0' },

  listBox: { display: 'flex', flexDirection: 'column', gap: '10px' },
  emptyText: { textAlign: 'center', padding: '40px 0', color: '#adb5bd', fontSize: '13px' },

  dangerItem: { display: 'flex', gap: '10px', padding: '12px 14px', backgroundColor: '#fff5f5', borderLeft: '4px solid #dc3545', borderRadius: '4px', alignItems: 'flex-start' },
  synergyItem: { display: 'flex', gap: '10px', padding: '12px 14px', backgroundColor: '#f0fff4', borderLeft: '4px solid #28a745', borderRadius: '4px', alignItems: 'flex-start' },

  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  thRow: { backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' },
  th: { padding: '12px 10px', fontSize: '13px', color: '#495057', textAlign: 'left', fontWeight: 'bold' },
  tr: { borderBottom: '1px solid #f1f3f5', transition: 'background 0.15s' },
  td: { padding: '12px 10px', fontSize: '14px', color: '#212529' },

  footer: { marginTop: '30px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #dee2e6', paddingTop: '18px' },
  restartBtn: { padding: '11px 16px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#6c757d', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' },
  prevBtn: { padding: '11px 20px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#495057', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  saveBtn: { padding: '11px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#28a745', color: '#fff', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
