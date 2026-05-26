import React, { useState, useEffect, useMemo } from 'react';
import '../data/courses_all.js';

const getCourseId = (c) => c?.course_id ?? c?.course_code ?? c?.['과목코드'] ?? '';

export default function Step2({ formData, setFormData, onNext, onPrev, onRestart }) {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mainTab, setMainTab] = useState('major');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'grade'

  useEffect(() => {
    if (window.COURSE_DATA?.length > 0) setCourses(window.COURSE_DATA);
    const interval = setInterval(() => {
      if (window.COURSE_DATA?.length > 0) { setCourses(window.COURSE_DATA); clearInterval(interval); }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const majorCourses = useMemo(() => formData?.majorCourses ?? [], [formData.majorCourses]);
  const minorCourses = useMemo(() => formData?.minorCourses ?? [], [formData.minorCourses]);
  const otherCourses = useMemo(() => formData?.otherCourses ?? [], [formData.otherCourses]);
  const majorIdSet = useMemo(() => new Set(majorCourses.map(getCourseId)), [majorCourses]);
  const minorIdSet = useMemo(() => new Set(minorCourses.map(getCourseId)), [minorCourses]);
  const otherIdSet = useMemo(() => new Set(otherCourses.map(getCourseId)), [otherCourses]);

  const activeDept = mainTab === 'major' ? (formData.major ?? '') : mainTab === 'minor' ? (formData.minor ?? '') : '';
  const activeDetail = mainTab === 'major' ? (formData.majorDetail ?? '') : mainTab === 'minor' ? (formData.minorDetail ?? '') : '타전공/기타';
  const activeCourses = mainTab === 'major' ? majorCourses : mainTab === 'minor' ? minorCourses : otherCourses;
  const activeIdSet = mainTab === 'major' ? majorIdSet : mainTab === 'minor' ? minorIdSet : otherIdSet;
  const activeColor = mainTab === 'major' ? '#0d6efd' : mainTab === 'minor' ? '#6f42c1' : '#e67e22';

  const majorCredits = useMemo(() => majorCourses.reduce((sum, c) => sum + (c.credits ?? 3), 0), [majorCourses]);
  const minorCredits = useMemo(() => minorCourses.reduce((sum, c) => sum + (c.credits ?? 3), 0), [minorCourses]);
  const otherCredits = useMemo(() => otherCourses.reduce((sum, c) => sum + (c.credits ?? 3), 0), [otherCourses]);
  const totalCredits = majorCredits + minorCredits + otherCredits;

  const allDeptCourses = useMemo(() => {
    if (courses.length === 0) return [];
    const seenKeys = new Set();
    const list = [];
    if (mainTab === 'other') {
      const excludeDepts = new Set([formData.major, formData.minor].filter(Boolean));
      courses.forEach(course => {
        const dept = (course.department ?? '').trim();
        if (excludeDepts.has(dept)) return;
        const courseKey = getCourseId(course) || String(course.course_name).trim();
        if (seenKeys.has(courseKey)) return;
        seenKeys.add(courseKey);
        list.push(course);
      });
    } else {
      const targetDept = activeDept;
      if (!targetDept) return [];
      courses.forEach(course => {
        if ((course.department ?? '').trim() !== targetDept.trim()) return;
        const courseKey = getCourseId(course) || String(course.course_name).trim();
        if (seenKeys.has(courseKey)) return;
        seenKeys.add(courseKey);
        list.push(course);
      });
    }
    return list;
  }, [courses, mainTab, activeDept, formData.major, formData.minor]);

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
    // 정렬
    return [...result].sort((a, b) => {
      if (sortBy === 'grade') return (a.grade_level || 0) - (b.grade_level || 0);
      return (a.course_name || '').localeCompare(b.course_name || '', 'ko');
    });
  }, [allDeptCourses, searchTerm, sortBy]);

  const handleToggle = (course) => {
    const id = getCourseId(course);
    const fieldMap = { major: 'majorCourses', minor: 'minorCourses', other: 'otherCourses' };
    const field = fieldMap[mainTab];
    const updated = activeIdSet.has(id)
      ? activeCourses.filter(c => getCourseId(c) !== id)
      : [...activeCourses, course];
    setFormData({ ...formData, [field]: updated });
  };

  const switchMainTab = (tab) => { setMainTab(tab); setSearchTerm(''); };
  const hasMinor = Boolean(formData.minor);

  return (
    <div>
      <div style={st.header}>
        <h2 style={st.title}>2. 기이수 과목을 선택해주세요</h2>
        <p style={st.subtitle}>이수 완료한 과목을 검색하여 체크하세요.</p>
      </div>

      <div style={st.layout}>
        <div style={st.left}>
          <div style={st.mainTabRow}>
            <TabBtn active={mainTab === 'major'} color="#0d6efd" onClick={() => switchMainTab('major')}>
              주전공 {majorCourses.length > 0 && <Chip active={mainTab === 'major'}>{majorCourses.length}</Chip>}
            </TabBtn>
            <TabBtn active={mainTab === 'minor'} color="#6f42c1" disabled={!hasMinor}
              onClick={() => hasMinor && switchMainTab('minor')}>
              복수/부전공 {hasMinor && minorCourses.length > 0 && <Chip active={mainTab === 'minor'}>{minorCourses.length}</Chip>}
              {!hasMinor && <span style={{ fontSize: '11px', marginLeft: '2px', color: '#adb5bd' }}>&#128274;</span>}
            </TabBtn>
            <TabBtn active={mainTab === 'other'} color="#e67e22" onClick={() => switchMainTab('other')}>
              타전공/기타 {otherCourses.length > 0 && <Chip active={mainTab === 'other'}>{otherCourses.length}</Chip>}
            </TabBtn>
            <div style={st.deptChip}>
              <span style={{ color: activeColor }}>&#9679;</span> {activeDetail || activeDept || '전공 미선택'}
            </div>
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
              전체 {allDeptCourses.length}개{searchTerm && ` · 검색결과 ${filteredCourses.length}개`}
            </span>
          </div>

          <div style={st.listBox}>
            {mainTab !== 'other' && !activeDept ? (
              <div style={st.empty}>1단계에서 전공을 선택하면 과목이 표시됩니다.</div>
            ) : filteredCourses.length === 0 ? (
              <div style={st.empty}>{searchTerm ? '검색 결과가 없습니다.' : '해당 과목이 없습니다.'}</div>
            ) : (
              filteredCourses.map(course => {
                const id = getCourseId(course);
                return (
                  <CourseRow key={id} course={course} isSelected={activeIdSet.has(id)}
                    onToggle={() => handleToggle(course)} color={activeColor}
                    showDept={mainTab === 'other'} />
                );
              })
            )}
          </div>
        </div>

        {/* 우측: 보관함 */}
        <div style={st.right}>
          <div style={st.basketHeader}>
            <span style={st.basketTitle}>담은 보관함</span>
            <span style={{ color: '#0d6efd', fontWeight: 'bold', fontSize: '16px' }}>{totalCredits}학점</span>
          </div>
          <BasketSection label="주전공 기이수" color="#0d6efd" courses={majorCourses} credits={majorCredits}
            onRemove={id => setFormData({ ...formData, majorCourses: majorCourses.filter(c => getCourseId(c) !== id) })}
            onClear={() => setFormData({ ...formData, majorCourses: [] })} />
          {hasMinor && (
            <BasketSection label="복수/부전공 기이수" color="#6f42c1" courses={minorCourses} credits={minorCredits}
              onRemove={id => setFormData({ ...formData, minorCourses: minorCourses.filter(c => getCourseId(c) !== id) })}
              onClear={() => setFormData({ ...formData, minorCourses: [] })} />
          )}
          <BasketSection label="타전공/기타 기이수" color="#e67e22" courses={otherCourses} credits={otherCredits}
            onRemove={id => setFormData({ ...formData, otherCourses: otherCourses.filter(c => getCourseId(c) !== id) })}
            onClear={() => setFormData({ ...formData, otherCourses: [] })} />
        </div>
      </div>

      <div style={st.footer}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={st.restartBtn} onClick={onRestart}>처음부터 시작</button>
          <button style={st.prevBtn} onClick={onPrev}>&larr; 이전 단계</button>
        </div>
        <button style={st.nextBtn} onClick={onNext}>다음 단계 &rarr;</button>
      </div>
    </div>
  );
}

/* ──────────── 서브 컴포넌트 ──────────── */
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

function Chip({ active, children }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px',
      backgroundColor: active ? 'rgba(255,255,255,0.3)' : '#e9ecef', color: active ? '#fff' : '#555',
    }}>{children}</span>
  );
}

function CourseRow({ course, isSelected, onToggle, color, showDept }) {
  return (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderBottom: '1px solid #f1f3f5',
      backgroundColor: isSelected ? `${color}0d` : 'transparent', cursor: 'pointer', userSelect: 'none',
    }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${isSelected ? color : '#ced4da'}`, backgroundColor: isSelected ? color : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isSelected && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>&#10003;</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: isSelected ? '600' : '500', color: isSelected ? color : '#212529', marginBottom: '3px' }}>
          {course.course_name ?? ''}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {showDept && <span style={{ backgroundColor: '#fff3e0', color: '#e67e22', padding: '1px 5px', borderRadius: '3px', fontSize: '10px', fontWeight: '600' }}>{course.department}</span>}
          <span style={{ backgroundColor: '#e9ecef', color: '#495057', padding: '1px 5px', borderRadius: '3px', fontSize: '11px' }}>{course.category ?? '전선'}</span>
          <span style={{ fontSize: '11px', color: '#868e96' }}>{course.credits ?? 3}학점</span>
          {course.grade_level > 0 && <span style={{ fontSize: '11px', color: '#adb5bd' }}>{course.grade_level}학년</span>}
        </div>
      </div>
      <span style={{ fontSize: '12px', fontWeight: '600', color: isSelected ? color : '#ced4da', flexShrink: 0 }}>
        {isSelected ? '✓ 이수' : '+ 선택'}
      </span>
    </div>
  );
}

function BasketSection({ label, color, courses, credits, onRemove, onClear }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>{label}</span>
        <span style={{ color, fontWeight: 'bold', fontSize: '13px' }}>{credits}학점</span>
        {courses.length > 0 && (
          <button type="button" onClick={onClear} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#dc3545', fontSize: '11px', cursor: 'pointer' }}>비우기</button>
        )}
      </div>
      {courses.length === 0 ? (
        <div style={{ padding: '10px', textAlign: 'center', color: '#adb5bd', fontSize: '12px', backgroundColor: '#f1f3f5', borderRadius: '6px' }}>선택된 과목 없음</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '150px', overflowY: 'auto' }}>
          {courses.map(c => {
            const id = getCourseId(c);
            return (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', backgroundColor: '#fff', borderRadius: '6px', border: `1px solid ${color}33` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.course_name ?? ''}</div>
                  <div style={{ fontSize: '10px', color: '#adb5bd', marginTop: '1px' }}>{c.credits ?? 3}학점</div>
                </div>
                <button type="button" onClick={() => onRemove(id)} style={{ background: 'none', border: 'none', fontSize: '16px', color: '#adb5bd', cursor: 'pointer', flexShrink: 0 }}>&times;</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const st = {
  header:     { marginBottom: '16px', borderBottom: '1px solid #dee2e6', paddingBottom: '14px' },
  title:      { fontSize: '22px', fontWeight: 'bold', color: '#212529', margin: '0 0 6px 0' },
  subtitle:   { fontSize: '14px', color: '#6c757d', margin: 0 },
  layout:     { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  left:       { flex: '1 1 0', minWidth: 0 },
  mainTabRow: { display: 'flex', alignItems: 'flex-end', gap: '4px', borderBottom: '2px solid #dee2e6' },
  deptChip:   { marginLeft: 'auto', fontSize: '12px', color: '#495057', backgroundColor: '#f8f9fa', padding: '5px 10px', borderRadius: '6px', border: '1px solid #dee2e6', marginBottom: '4px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  controlRow: { display: 'flex', gap: '10px', alignItems: 'center', margin: '12px 0 0' },
  search:     { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  sortBtns:   { display: 'flex', gap: '4px', flexShrink: 0 },
  sortBtn:    { padding: '8px 12px', borderRadius: '6px', border: '1px solid #dee2e6', backgroundColor: '#fff', color: '#868e96', fontSize: '12px', cursor: 'pointer', fontWeight: '500' },
  sortActive: { backgroundColor: '#0d6efd', color: '#fff', borderColor: '#0d6efd' },
  countRow:   { padding: '6px 0', display: 'flex', justifyContent: 'flex-end' },
  listBox:    { border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden', height: '420px', overflowY: 'auto', backgroundColor: '#fff' },
  empty:      { textAlign: 'center', padding: '50px 20px', color: '#adb5bd', fontSize: '13px' },
  right:         { width: '255px', flexShrink: 0, backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '16px', border: '1px solid #dee2e6', position: 'sticky', top: '20px' },
  basketHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #dee2e6' },
  basketTitle:   { fontSize: '15px', fontWeight: 'bold', color: '#212529' },
  footer:  { marginTop: '22px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #dee2e6', paddingTop: '18px' },
  restartBtn: { padding: '11px 16px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#6c757d', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' },
  prevBtn: { padding: '11px 20px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#495057', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  nextBtn: { padding: '11px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#0d6efd', color: '#fff', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
};
