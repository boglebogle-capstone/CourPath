import React, { useState } from 'react';
import Step1 from './components/Step1';
import Step2 from './components/Step2';
import Step3 from './components/Step3';
import Step4 from './components/Step4';
import Step5 from './components/Step5'; 

export default function App() {
  const [step, setStep] = useState(1);
  
  // 전체 단계를 관통하는 마스터 데이터 주머니
  const [formData, setFormData] = useState({
    major: '',              // 주전공 (대분류 - 단과대학)
    majorDetail: '',        // 주전공 (소분류 - 학과)
    minor: '',              // 복수전공 (대분류)
    minorDetail: '',        // 복수전공 (소분류)
    grade: '',              // 학년
    majorCourses: [],       // 주전공 기이수 과목
    minorCourses: [],       // 복수전공 기이수 과목
    otherCourses: [],       // 타전공/기타 기이수 과목
    nextSemesterCourses: [],// 다음 학기 예정 과목
    jobCategory: '',        // 직무 대분류
    jobSub: '',             // 세부 직무
  });

  const onNext = () => setStep((p) => p + 1);
  const onPrev = () => setStep((p) => p - 1);

  // 5단계 흐름 인덱스 맵
  const STEP_NAMES = [
    '학년/전공 입력',
    '기이수 과목 선택',
    '수강 예정 선택',
    '목표 직무 선택',
    '최종 분석 실행'
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '4px auto', padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── 1. 5단계 상단 인덱스 바 ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #e9ecef', paddingBottom: '15px' }}>
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

      {/* ── 2. 중앙 스텝 조건부 라우팅 구역 (실제 본문 콘텐츠) ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '10px', flex: 1 }}>
        {step === 1 && <Step1 formData={formData} setFormData={setFormData} onNext={onNext} />}
        {step === 2 && <Step2 formData={formData} setFormData={setFormData} onNext={onNext} onPrev={onPrev} />}
        {step === 3 && <Step3 formData={formData} setFormData={setFormData} onNext={onNext} onPrev={onPrev} />}
        {step === 4 && <Step4 formData={formData} setFormData={setFormData} onNext={onNext} onPrev={onPrev} />}
        {step === 5 && <Step5 formData={formData} onPrev={onPrev} />}
      </div>

      {/* ── 3. 🔥 [요청 반영] 전 화면 공통 하단 푸터 표기 구역 ── */}
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