import React, { useState, useEffect, useCallback } from 'react';
import Intro from './components/Intro';
import Step1 from './components/Step1';
import Step2 from './components/Step2';
import Step3 from './components/Step3';
import Step4 from './components/Step4';
import Step5 from './components/Step5';

const CACHE_KEY = 'courpath_formData';
const CACHE_STEP_KEY = 'courpath_step';
const CACHE_TTL = 30 * 60 * 1000; // 30분

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, step, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_STEP_KEY);
      return null;
    }
    return { data, step };
  } catch { return null; }
}

function saveCache(data, step) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, step, timestamp: Date.now() }));
  } catch {}
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_STEP_KEY);
}

const INITIAL_FORM = {
  major: '',
  majorDetail: '',
  minor: '',
  minorDetail: '',
  grade: '',
  majorCourses: [],
  minorCourses: [],
  otherCourses: [],
  nextSemesterCourses: [],
  jobCategory: '',
  jobSub: '',
};

export default function App() {
  const cached = loadCache();
  const [step, setStep] = useState(cached ? cached.step : 0);
  const [formData, setFormData] = useState(cached ? cached.data : { ...INITIAL_FORM });

  // 캐시 자동 저장 (step, formData 변경 시)
  useEffect(() => {
    if (step >= 1) saveCache(formData, step);
  }, [formData, step]);

  const onNext = () => setStep((p) => p + 1);
  const onPrev = () => setStep((p) => p - 1);

  const handleRestart = useCallback(() => {
    clearCache();
    setFormData({ ...INITIAL_FORM });
    setStep(0);
  }, []);

  const STEP_NAMES = [
    '기본 정보 입력',
    '기이수 과목 선택',
    '수강 예정 선택',
    '입력 사항 확인',
    '분석 결과'
  ];

  // 소개 페이지
  if (step === 0) {
    return <Intro onStart={() => setStep(1)} cachedExists={!!cached} />;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '4px auto', padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* 상단 인덱스 바 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #e9ecef', paddingBottom: '15px', alignItems: 'center' }}>
        {STEP_NAMES.map((name, idx) => {
          const currentIdx = idx + 1;
          const isActive = step === currentIdx;
          return (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '14px',
                fontWeight: isActive ? 'bold' : 'normal',
                color: isActive ? '#0d6efd' : '#adb5bd',
                borderBottom: isActive ? '2px solid #0d6efd' : 'none',
                paddingBottom: '4px'
              }}>
                {currentIdx}. {name}
              </span>
              {idx < STEP_NAMES.length - 1 && <span style={{ color: '#ced4da', fontSize: '12px' }}>&rarr;</span>}
            </div>
          );
        })}
      </div>

      {/* 중앙 콘텐츠 */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '10px', flex: 1 }}>
        {step === 1 && <Step1 formData={formData} setFormData={setFormData} onNext={onNext} onRestart={handleRestart} />}
        {step === 2 && <Step2 formData={formData} setFormData={setFormData} onNext={onNext} onPrev={onPrev} onRestart={handleRestart} />}
        {step === 3 && <Step3 formData={formData} setFormData={setFormData} onNext={onNext} onPrev={onPrev} onRestart={handleRestart} />}
        {step === 4 && <Step4 formData={formData} onNext={onNext} onPrev={onPrev} onRestart={handleRestart} />}
        {step === 5 && <Step5 formData={formData} onPrev={onPrev} onRestart={handleRestart} />}
      </div>

      {/* 하단 푸터 */}
      <div style={{
        marginTop: '60px',
        paddingTop: '20px',
        borderTop: '1px solid #e9ecef',
        textAlign: 'center',
        fontSize: '13px',
        color: '#868e96',
        letterSpacing: '0.3px',
        fontWeight: '500'
      }}>
        이 웹 화면은 Gemini, Claude를 사용하여 만들었습니다
      </div>

    </div>
  );
}
