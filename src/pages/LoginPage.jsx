// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Building2, LogIn, UserPlus, ShieldCheck, CheckCircle2, Lock, Sparkles, Mail, User, Hash, Briefcase } from 'lucide-react';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { useData } from '../context/DataContext';

export default function LoginPage() {
  const { login, updateUserProfile } = useGoogleAuth();
  const { saveStaffToSheet, departments, teams, staffs } = useData();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [submitting, setSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // 💡 관리자가 등록/운용 중인 공식 부서/팀 목록만 추출
  const availableDepartments = Array.from(new Set([
    ...(departments || []),
    ...(staffs || []).map(s => s.dept).filter(Boolean)
  ]));

  const availableTeams = Array.from(new Set([
    ...(teams || []),
    ...(staffs || []).map(s => s.team).filter(Boolean)
  ]));

  const defaultDept = availableDepartments[0] || '세종영업본부';
  const defaultTeam = availableTeams[0] || '영업1조';

  const [regForm, setRegForm] = useState({
    dept: defaultDept,
    team: defaultTeam,
    userName: '',
    userCode: '',
    companyCode: '3',
    email: '',
    role: '일반사원',
    status: '승인대기',
  });

  // 회원가입 신청 제출
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.userName.trim()) return alert('성명을 입력해 주세요.');
    if (!regForm.userCode.trim()) return alert('사원고유번호를 입력해 주세요.');

    try {
      setSubmitting(true);
      await saveStaffToSheet({
        ...regForm,
        team: regForm.team || regForm.dept,
        status: '승인대기',
        role: '일반사원',
      });
      setRegisterSuccess(true);
    } catch (err) {
      alert('회원가입 신청 실패: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* 배경 장식 그래디언트 애니메이션 링 */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative z-10">
        
        {/* 상단 로고 & 타이틀 헤더 */}
        <div className="bg-slate-900 text-white p-8 text-center relative">
          <div className="bg-white p-3 rounded-2xl mx-auto inline-block mb-3 shadow-lg">
            <img src="/images/kyungsung_logo.jpg" alt="경성문화사 로고" className="h-10 object-contain mx-auto" />
          </div>
          <h1 className="text-xl font-black tracking-wide text-white">영업미수관리 PWA</h1>
          <p className="text-xs text-slate-400 mt-1">통합 전표, 매출, 수금 및 팀별 그룹 관리 시스템</p>
        </div>

        {/* 탭 전환: [사원 로그인] vs [미등록 가입 신청] */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setRegisterSuccess(false); }}
            className={`py-3.5 transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'login' ? 'bg-white text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>사원 로그인</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`py-3.5 transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'register' ? 'bg-white text-sky-600 border-b-2 border-sky-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>미등록 회원가입 신청</span>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          
          {/* 🔑 1. 사원 로그인 탭 */}
          {activeTab === 'login' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-slate-800 text-base">로그인하여 시스템 시작하기</h3>
                <p className="text-xs text-slate-500">Google 계정을 통해 안전하게 데이터베이스에 접근합니다.</p>
              </div>

              {/* 구글 공식 로그인 버튼 */}
              <button
                onClick={login}
                className="w-full flex items-center justify-center space-x-3 bg-sky-600 hover:bg-sky-700 text-white py-3 px-4 rounded-2xl font-bold text-sm shadow-md shadow-sky-200 transition"
              >
                <LogIn className="w-5 h-5" />
                <span>Google 계정으로 로그인</span>
              </button>
            </div>
          )}

          {/* 📝 2. 미등록 회원 가입 신청 탭 */}
          {activeTab === 'register' && (
            <div>
              {registerSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">가입 신청 완료!</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>{regForm.userName} ({regForm.userCode})</strong> 사원님의 가입 신청이 성공적으로 제출되었습니다.<br/>
                      관리자 승인 후 시스템 로그인 및 이용이 가능합니다.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setRegisterSuccess(false); }}
                    className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-slate-800 transition"
                  >
                    로그인 화면으로 이동
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="text-center mb-3">
                    <h3 className="font-bold text-slate-800 text-sm">미등록 사원 신규 가입 신청</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">관리자가 등록한 지정 부서를 선택해 가입 신청합니다.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">소속 부서 선택 *</label>
                      <select
                        required
                        value={regForm.dept}
                        onChange={e => setRegForm({ ...regForm, dept: e.target.value, team: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 cursor-pointer bg-white"
                      >
                        {availableDepartments.length === 0 ? (
                          <option value="세종영업본부">🏢 세종영업본부</option>
                        ) : (
                          availableDepartments.map(deptName => (
                            <option key={deptName} value={deptName}>
                              🏢 {deptName}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">세부 팀명 선택 *</label>
                      <select
                        required
                        value={regForm.team}
                        onChange={e => setRegForm({ ...regForm, team: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 cursor-pointer bg-white"
                      >
                        {availableTeams.length === 0 ? (
                          <option value="영업1조">👥 영업1조</option>
                        ) : (
                          availableTeams.map(tName => (
                            <option key={tName} value={tName}>
                              👥 {tName}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">성명 *</label>
                    <input
                      type="text"
                      required
                      placeholder="성명을 입력하세요"
                      value={regForm.userName}
                      onChange={e => setRegForm({ ...regForm, userName: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">희망 사원고유번호 *</label>
                      <input
                        type="text"
                        required
                        placeholder="예: 44 또는 85"
                        value={regForm.userCode}
                        onChange={e => setRegForm({ ...regForm, userCode: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-rose-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">회사코드</label>
                      <input
                        type="text"
                        placeholder="기본: 3"
                        value={regForm.companyCode}
                        onChange={e => setRegForm({ ...regForm, companyCode: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">이메일 주소</label>
                    <input
                      type="email"
                      placeholder="example@company.com"
                      value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition disabled:opacity-50 mt-2"
                  >
                    {submitting ? '신청 제출 중...' : '회원가입 신청서 제출'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* 하단 푸터 텍스트 */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center text-[10px] text-slate-400">
          ⓒ KYUNGSUNG 경성문화사 영업미수관리 PWA. All rights reserved.
        </div>
      </div>
    </div>
  );
}
