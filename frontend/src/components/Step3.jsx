import React, { useState, useEffect, useMemo } from 'react';
import '../data/courses_all.js';

const getCourseId = (c) => c?.course_id ?? c?.course_code ?? c?.['과목코드'] ?? '';

export default function Step3({ formData, setFormData, onNext, onPrev, onRestart }) {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mainTab, setMainTab] = useState('major');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    if (window.COURSE_DATA?.length > 0) setCourses(window.COURSE_DATA);
    const interval = setInterval(() => {
      if (window.COURSE_DATA?.length > 0) { setCourses(window.COURSE_DATA); clearInterval(interval); }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const alreadyTakenIds = useMemo(() => {
    const taken = [...(formData.majorCourses ?? []), ...(formData.minorCourses ?? []), ...(formData.otherCourses ?? [])];
    return new Set(taken.map(getCourseId));
  }, [formData.majorCourses, formData.minorCourses, formData.otherCourses]);

  const nextSemesterCourses = useMemo(() => formData?.nextSemesterCourses ?? [], [formData.nextSemesterCourses]);
  const nextSemesterIdSet = useMemo(() => new Set(nextSemesterCourses.map(getCourseId)), [nextSemesterCourses]);

  const activeDept = mainTab === 'major' ? (formData.major ?? '') : mainTab === 'minor' ? (formData.minor ?? '') : '';
  const activeDetail = mainTab === 'major' ? (formData.majorDetail ?? '') : mainTab === 'minor' ? (formData.minorDetail ?? '') : '타전공/기타';
  const activeColor = mainTab === 'major' ? '#0d6efd' : mainTab === 'minor' ? '#6f42c1' : '#e67e22';

  const allDeptCourses = useMemo(() => {
    if (courses.length === 0) return [];
    const seenKeys = new Set();
    const list = [];
    if (mainTab === 'other') {
      const excludeDepts = new Set([formData.major, formData.minor].filter(Boolean));
      courses.forEach(course => {
        const dept = (course.department ?? '').trim();
        if (excludeDepts.has(dept)) return;
        const id = getCourseId(course);
        if (alreadyTakenIds.has(id)) return;
        const courseKey = id || String(course.course_name).trim();
        if (seenKeys.has(courseKey)) return;
        seenKeys.add(courseKey);
        list.push(course);
      });
    } else {
      if (!activeDept) return [];
      courses.forEach(course => {
        if ((course.department ?? '').trim() !== activeDept.trim()) return;
        const id = getCourseId(course);
        if (alreadyTakenIds.has(id)) return;
        const courseKey = id || String(course.course_name).trim();
        if (seenKeys.has(courseKey)) return;
        seenKeys.add(courseKey);
        list.push(course);
      });
    }
    return list;
  }, [courses, mainTab, activeDept, formData.major, formData.minor, alreadyTakenIds]);

  const filteredCourses = useMemo(() => {
    let result = allDeptCourses;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.course_name?.toLowerCase().includes(q) ||
        String(c.course_id ?? '').includes(searchTerm) ||
        (c.category ?? '').includes(searchTerm) ||
        (c.department ?? '').includes(searchTerm)
      );
    }
    return [...result].sort((a, b) => {
      if (sortBy === 'grade') return (a.grade_level || 0) - (b.grade_level || 0);
      return (a.course_name || '').localeCompare(b.course_name || '', 'ko');
    });
  }, [allDeptCourses, searchTerm, sortBy]);

  const handleToggle = (course) => {
    const id = getCourseId(course);
    const updated = nextSemesterIdSet.has(id)
      ? nextSemesterCourses.filter(c => getCourseId(c) !== id)
      : [...nextSemesterCourses, course];
    setFormData({ ...formData, nextSemesterCourses: updated });
  };

  const totalCredits = useMemo(() => {
    return nextSemesterCourses.reduce((sum, c) => sum + (Number(c.credits) || 3), 0);
  }, [nextSemesterCourses]);

  const hasMinor = Boolean(formData.minor);

  // 장바구니를 전공별로 분류
  const majorPlanned = useMemo(() => nextSemesterCourses.filter(c => (c.department ?? '').trim() === (formData.major ?? '').trim()), [nextSemesterCourses, formData.major]);
  const minorPlanned = useMemo(() => {
    if (!formData.minor) return [];
    if (formData.minor === formData.major) return []; // 같은 단과대면 주전공에 포함
    return nextSemesterCourses.filter(c => (c.department ?? '').trim() === (formData.minor ?? '').trim());
  }, [nextSemesterCourses, formData.minor, formData.major]);
  const otherPlanned = useMemo(() => {
    const myDepts = new Set([formData.major, formData.minor].filter(Boolean));
    return nextSemesterCourses.filter(c => !myDepts.has((c.department ?? '').trim()));
  }, [nextSemesterCourses, formData.major, formData.minor]);

  return (
    <div>
      <div style={st.header}>
        <h2 style={st.title}>3. 다음 학기 수강 예정 과목을 골라주세요</h2>
        <p style={st.subtitle}>이미 이수한 과목을 제외한 잔여 과목입니다. 예정 과목을 바구니에 담아보세요.</p>
      </div>

      <div style={st.layout}>
        <div style={st.left}>
          <div style={st.mainTabRow}>
            <TabBtn active={mainTab === 'major'} color="#0d6efd" onClick={() => { setMainTab('major'); setSearchTerm(''); }}>
              주전공 미이수
            </TabBtn>
            {hasMinor && (
              <TabBtn active={mainTab === 'minor'} color="#6f42c1" onClick={() => { setMainTab('minor'); setSearchTerm(''); }}>
                복수/부전공 미이수
              </TabBtn>
            )}
            <TabBtn active={mainTab === 'other'} color="#e67e22" onClick={() => { setMainTab('other'); setSearchTerm(''); }}>
              타전공/기타
            </TabBtn>
            <div style={st.deptChip}><span style={{ color: activeColor }}>&#9679;</span> {activeDetail || activeDept}</div>
          </div>

          <div style={st.controlRow}>
            <input style={st.search}
              placeholder={mainTab === 'other' ? '타전공 과목명, 학과명 검색...' : '과목명, 과목코드 검색...'}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <div style={st.sortBtns}>
              <button style={{ ...st.sortBtn, ...(sortBy === 'name' ? st.sortActive : {}) }} onClick={() => setSortBy('name')}>과목명순</button>
              <button style={{ ...st.sortBtn, ...(sortBy === 'grade' ? st.sortActive : {}) }} onClick={() => setSortBy('grade')}>수준순</button>
            </div>
          </div>

          <div style={st.countRow}>
            <span style={{ fontSize: '12px', color: '#868e96' }}>
              잔여 {allDeptCourses.length}개{searchTerm && ` · 검색결과 ${filteredCourses.length}개`}
            </span>
          </div>

          <div style={st.listBox}>
            {mainTab !== 'other' && !activeDept ? (
              <div style={st.empty}>1단계에서 전공을 선택하면 과목이 표시됩니다.</div>
            ) : filteredCourses.length === 0 ? (
              <div style={st.empty}>{searchTerm ? '검색 결과가 없습니다.' : '남아있는 과목이 없습니다.'}</div>
            ) : (
              filteredCourses.map(course => {
                const isSelected = nextSemesterIdSet.has(getCourseId(course));
                return (
                  <div key={getCourseId(course)} onClick={() => handleToggle(course)}
                    style={{...st.row, backgroundColor: isSelected?'#f0f7ff':'transparent'}}>
                    <div style={{...st.circle, backgroundColor: isSelected?activeColor:'#fff', borderColor: isSelected?activeColor:'#ced4da'}}>
                      {isSelected && '✓'}
                    </div>
                    <div style={{flex:1}}>
                      <div style={st.cName}>{course.course_name}</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {mainTab === 'other' && <span style={{ backgroundColor: '#fff3e0', color: '#e67e22', padding: '1px 5px', borderRadius: '3px', fontSize: '10px', fontWeight: '600' }}>{course.department}</span>}
                        <span style={st.cMeta}>{course.category} · {course.credits}학점</span>
                        {course.grade_level > 0 && <span style={{ fontSize: '11px', color: '#adb5bd' }}>{course.grade_level}학년</span>}
                      </div>
                    </div>
                    <span style={{fontSize:'12px', color: isSelected?activeColor:'#ced4da'}}>{isSelected?'담김':'+ 담기'}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측 수강 바구니 - 전공별 구분 */}
        <div style={st.right}>
          <div style={st.bHead}><span>예정 장바구니</span><span style={{color:'#0d6efd', fontWeight:'bold'}}>{totalCredits} 학점</span></div>
          <BasketGroup label="주전공" color="#0d6efd" courses={majorPlanned} onToggle={handleToggle} />
          {hasMinor && formData.minor !== formData.major && (
            <BasketGroup label="복수/부전공" color="#6f42c1" courses={minorPlanned} onToggle={handleToggle} />
          )}
          <BasketGroup label="타전공/기타" color="#e67e22" courses={otherPlanned} onToggle={handleToggle} />
        </div>
      </div>

      <div style={st.footer}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={st.restartBtn} onClick={onRestart}>처음부터 시작</button>
          <button style={st.prevBtn} onClick={onPrev}>&larr; 이전 단계</button>
        </div>
        <button style={{...st.nextBtn, backgroundColor: nextSemesterCourses.length>0?'#0d6efd':'#e9ecef', color: nextSemesterCourses.length>0?'#fff':'#adb5bd'}}
          disabled={nextSemesterCourses.length===0} onClick={onNext}>다음 단계 &rarr;</button>
      </div>
    </div>
  );
}

function BasketGroup({ label, color, courses, onToggle }) {
  const credits = courses.reduce((s, c) => s + (Number(c.credits) || 3), 0);
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#495057' }}>{label}</span>
        <span style={{ fontSize: '12px', color, fontWeight: 'bold' }}>{credits}학점</span>
      </div>
      {courses.length === 0 ? (
        <div style={{ padding: '10px', textAlign: 'center', color: '#adb5bd', fontSize: '12px', backgroundColor: '#f1f3f5', borderRadius: '6px' }}>선택된 과목 없음</div>
      ) : (
        courses.map(c => (
          <div key={getCourseId(c)} style={{ display: 'flex', alignItems: 'center', padding: '7px 8px', backgroundColor: '#fff', border: `1px solid ${color}33`, borderRadius: '6px', marginBottom: '4px' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.course_name}</div>
              <div style={{ fontSize: '10px', color: '#868e96' }}>{c.credits}학점</div>
            </div>
            <button type="button" onClick={() => onToggle(c)} style={{ background: 'none', border: 'none', color: '#adb5bd', fontSize: '16px', cursor: 'pointer' }}>&times;</button>
          </div>
        ))
      )}
    </div>
  );
}

function TabBtn({ active, color, disabled, onClick, children }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px',
        border: `2px solid ${active ? color : '#dee2e6'}`,
        borderBottom: active ? '2px solid #fff' : '2px solid #dee2e6',
        borderRadius: '8px 8px 0 0', backgroundColor: active ? color : '#fff',
        color: active ? '#fff' : '#495057', fontSize: '13px', fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
        marginBottom: '-2px', position: 'relative', zIndex: 1, transition: 'all 0.15s',
      }}
    >{children}</button>
  );
}

const st = {
  header: { marginBottom: '16px', borderBottom: '1px solid #dee2e6', paddingBottom: '14px' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#212529', margin: '0 0 6px 0' },
  subtitle: { fontSize: '14px', color: '#6c757d', margin: 0 },
  layout: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  left: { flex: '1 1 0', minWidth: 0 },
  mainTabRow: { display: 'flex', alignItems: 'flex-end', gap: '4px', borderBottom: '2px solid #dee2e6' },
  deptChip: { marginLeft: 'auto', fontSize: '12px', color: '#495057', backgroundColor: '#f8f9fa', padding: '5px 10px', borderRadius: '6px', border: '1px solid #dee2e6', marginBottom: '4px' },
  controlRow: { display: 'flex', gap: '10px', alignItems: 'center', margin: '12px 0 0' },
  search: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  sortBtns: { display: 'flex', gap: '4px', flexShrink: 0 },
  sortBtn: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', backgroundColor: '#fff', color: '#868e96', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
  sortActive: { backgroundColor: '#0d6efd', color: '#fff', borderColor: '#0d6efd' },
  countRow: { padding: '6px 0', display: 'flex', justifyContent: 'flex-end' },
  listBox: { border: '1px solid #e9ecef', borderRadius: '8px', height: '360px', overflowY: 'auto', backgroundColor: '#fff' },
  empty: { textAlign: 'center', padding: '50px', color: '#adb5bd', fontSize: '13px' },
  row: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #f1f3f5', cursor: 'pointer' },
  circle: { width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #ced4da', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff' },
  cName: { fontSize: '14px', fontWeight: '500', color: '#212529' },
  cMeta: { fontSize: '11px', color: '#868e96', marginTop: '2px' },
  right: { width: '250px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '14px', border: '1px solid #dee2e6' },
  bHead: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', paddingBottom: '8px', marginBottom: '10px' },
  bEmpty: { textAlign: 'center', color: '#adb5bd', fontSize: '12px', padding: '30px 0' },
  footer: { marginTop: '24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #dee2e6', paddingTop: '18px' },
  restartBtn: { padding: '10px 16px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#6c757d', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' },
  prevBtn: { padding: '10px 18px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: '#fff', cursor: 'pointer' },
  nextBtn: { padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }
};
