// src/context/GoogleAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const GoogleAuthContext = createContext();

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

const defaultProfile = {
  userCode: '44',
  userName: '김광일',
  companyCode: '3',
  email: 'richkikim@gmail.com',
};

export function GoogleAuthProvider({ children }) {
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(() => {
    try { return localStorage.getItem('google_access_token') || null; } catch { return null; }
  });

  // ✅ D1 마이그레이션 후: 세션은 Google 토큰과 독립적으로 유지
  // 로그인 시 'session_active' 플래그를 설정하고, 명시적 로그아웃 시에만 해제
  const [isSessionActive, setIsSessionActive] = useState(() => {
    try { return localStorage.getItem('session_active') === 'true'; } catch { return false; }
  });

  const savedProfile = (() => {
    try { return JSON.parse(localStorage.getItem('staff_profile_settings')); } catch { return null; }
  })();
  const [user, setUser] = useState(savedProfile ? { ...defaultProfile, ...savedProfile } : defaultProfile);

  // Google OAuth 토큰 클라이언트 초기화
  useEffect(() => {
    let cancelled = false;

    const initClient = () => {
      if (!CLIENT_ID || !window.google?.accounts?.oauth2?.initTokenClient) return false;

      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse?.access_token) {
            const token = tokenResponse.access_token;
            setAccessToken(token);
            localStorage.setItem('google_access_token', token);

            // 최초 Google 로그인 시 세션 활성화
            setIsSessionActive(true);
            localStorage.setItem('session_active', 'true');

            setUser(prev => {
              const updated = { ...prev, name: prev.userName || '구글 사용자' };
              localStorage.setItem('staff_profile_settings', JSON.stringify(updated));
              return updated;
            });
          }
        },
      });

      if (!cancelled) setTokenClient(client);
      return true;
    };

    if (!initClient()) {
      const timer = window.setInterval(() => {
        if (initClient()) window.clearInterval(timer);
      }, 200);
      return () => { cancelled = true; window.clearInterval(timer); };
    }
    return () => { cancelled = true; };
  }, []);

  // ✅ Google 토큰 만료 시 자동 갱신 시도 (세션은 유지, 강제 로그아웃 없음)
  useEffect(() => {
    const storedToken = (() => {
      try { return localStorage.getItem('google_access_token'); } catch { return null; }
    })();
    if (!storedToken || !isSessionActive) return;

    fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(storedToken)}`)
      .then(response => {
        if (!response.ok) {
          // 토큰이 만료됐지만 세션은 유지 - 조용히 토큰만 제거
          setAccessToken(null);
          localStorage.removeItem('google_access_token');
          // ✅ 세션은 유지 (로그아웃 안 함!)
        }
      })
      .catch(() => {
        setAccessToken(null);
        localStorage.removeItem('google_access_token');
        // ✅ 세션은 유지 (로그아웃 안 함!)
      });
  }, [isSessionActive]);

  const updateUserProfile = (newProfile) => {
    setUser(prev => {
      const updated = { ...prev, ...newProfile };
      localStorage.setItem('staff_profile_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const login = () => {
    if (!CLIENT_ID) {
      alert('Google OAuth Client ID가 설정되지 않았습니다.');
      return;
    }
    const client = tokenClient || (window.google?.accounts?.oauth2?.initTokenClient
      ? google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse) => {
            if (tokenResponse?.access_token) {
              const token = tokenResponse.access_token;
              setAccessToken(token);
              localStorage.setItem('google_access_token', token);
              setIsSessionActive(true);
              localStorage.setItem('session_active', 'true');
            }
          },
        })
      : null);

    if (!client) {
      alert('Google Identity Services SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    client.requestAccessToken({ prompt: 'consent' });
  };

  const logout = () => {
    // 명시적 로그아웃 시에만 세션 완전 해제
    setAccessToken(null);
    setIsSessionActive(false);
    try {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('session_active');
    } catch {}
    // 💡 사용자 프로필(staff_profile_settings)은 삭제하지 않고 유지
  };

  return (
    <GoogleAuthContext.Provider value={{
      accessToken,
      user,
      updateUserProfile,
      login,
      logout,
      // ✅ D1 마이그레이션 후: 세션 활성 여부로 판단 (Google 토큰 만료에 영향 안 받음)
      isLoggedIn: isSessionActive,
    }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export const useGoogleAuth = () => useContext(GoogleAuthContext);