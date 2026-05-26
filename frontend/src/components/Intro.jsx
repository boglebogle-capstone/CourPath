import React from 'react';

export default function Intro({ onStart, cachedExists }) {
  return (
    <div style={st.wrapper}>
      <div style={st.container}>
        <div style={st.logoArea}>
          <h1 style={st.logo}>CourPath</h1>
          <p style={st.tagline}>AI 기반 수강신청 가이드 시스템</p>
        </div>

        <div style={st.descBox}>
          <h2 style={st.descTitle}>내 수강신청, 직무와 얼마나 맞을까?</h2>
          <p style={st.descText}>
            CourPath는 KoSBERT 임베딩 기반으로 강의계획서와 채용공고를 분석하여,
            수강 과목과 목표 직무 간의 연관성을 정량적으로 평가합니다.
          </p>
          <div style={st.featureGrid}>
            <div style={st.featureCard}>
              <div style={st.featureIcon}>&#128269;</div>
              <div style={st.featureLabel}>과목-직무 매칭 분석</div>
              <div style={st.featureDesc}>수강 예정 과목이 목표 직무에 얼마나 도움이 되는지 시너지/충돌 판정</div>
            </div>
            <div style={st.featureCard}>
              <div style={st.featureIcon}>&#9888;&#65039;</div>
              <div style={st.featureLabel}>선수과목 충돌 감지</div>
              <div style={st.featureDesc}>선수과목 미이수, 학년 부적합 등 이수 순서 문제를 자동으로 점검</div>
            </div>
            <div style={st.featureCard}>
              <div style={st.featureIcon}>&#127919;</div>
              <div style={st.featureLabel}>맞춤 과목 추천</div>
              <div style={st.featureDesc}>목표 직무와 연관도가 높은 미수강 과목 TOP 5를 추천</div>
            </div>
          </div>
        </div>

        <div style={st.btnArea}>
          <button style={st.startBtn} onClick={onStart}>
            {cachedExists ? '이어서 진행하기' : '분석 시작하기'} &rarr;
          </button>
          {cachedExists && (
            <button style={st.newBtn} onClick={() => { localStorage.clear(); window.location.reload(); }}>
              처음부터 새로 시작
            </button>
          )}
        </div>

        <div style={st.teamInfo}>
          <span>Team 보글보글 | 한림대학교 캡스톤디자인</span>
        </div>
      </div>
    </div>
  );
}

const st = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', backgroundColor: '#f8f9fa' },
  container: { maxWidth: '700px', width: '100%', padding: '40px 30px', textAlign: 'center' },
  logoArea: { marginBottom: '36px' },
  logo: { fontSize: '48px', fontWeight: '900', margin: '0 0 8px 0', background: 'linear-gradient(135deg, #f48fb1, #ffd54f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  tagline: { fontSize: '16px', color: '#6c757d', margin: 0, fontWeight: '500' },
  descBox: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px 28px', border: '1px solid #e9ecef', marginBottom: '32px', textAlign: 'left' },
  descTitle: { fontSize: '20px', fontWeight: 'bold', color: '#212529', margin: '0 0 12px 0' },
  descText: { fontSize: '14px', color: '#6c757d', lineHeight: '1.7', margin: '0 0 24px 0' },
  featureGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' },
  featureCard: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '18px 14px', textAlign: 'center', border: '1px solid #e9ecef' },
  featureIcon: { fontSize: '28px', marginBottom: '8px' },
  featureLabel: { fontSize: '13px', fontWeight: 'bold', color: '#343a40', marginBottom: '6px' },
  featureDesc: { fontSize: '11px', color: '#868e96', lineHeight: '1.5' },
  btnArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '30px' },
  startBtn: { padding: '14px 40px', borderRadius: '10px', border: 'none', backgroundColor: '#0d6efd', color: '#fff', fontSize: '17px', fontWeight: 'bold', cursor: 'pointer', minWidth: '250px' },
  newBtn: { padding: '10px 24px', borderRadius: '8px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#6c757d', fontSize: '14px', cursor: 'pointer' },
  teamInfo: { fontSize: '12px', color: '#adb5bd' },
};
