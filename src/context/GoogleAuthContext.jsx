// src/context/GoogleAuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { normalizeStaffName } from '../utils/nameUtils';

const GoogleAuthContext = createContext();

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'openid email profile https://www.googleapis.com/auth/spreadsheets';

// 기본 익명 사용자 프로필 (로그인 전)
const emptyProfile = {
  userCode: '',
  userName: '',
  companyCode: '3',
  email: '',
  dept: '',
  team: '',
  role: '일반사원',
  status: '승인완료',
};

// Google UserInfo API 호출 헬퍼
async function fetchGoogleUserInfo(token) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Google UserInfo fetch failed:', err);
  }
  return null;
}

export function GoogleAuthProvider({ children }) {
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(() => {
    try { return localStorage.getItem('google_access_token') || null; } catch { return null; }
  });

  const savedProfile = (() => {
    try {
      const data = localStorage.getItem('staff_profile_settings');
      const parsed = data ? JSON.parse(data) : null;
      return parsed && parsed.email ? parsed : null;
    } catch { return null; }
  })();

  const [isSessionActive, setIsSessionActive] = useState(() => {
    try {
      const active = localStorage.getItem('session_active') === 'true';
      return Boolean(active && savedProfile?.email);
    } catch { return false; }
  });

  const [user, setUser] = useState(savedProfile || emptyProfile);

  // 로그인 성공 시 프로필 처리 함수
  const handleLoginSuccess = useCallback(async (token) => {
    setAccessToken(token);
    localStorage.setItem('google_access_token', token);
    setIsSessionActive(true);
    localStorage.setItem('session_active', 'true');

    // Google API를 통해 실제 로그인한 계정의 이메일 및 이름 획득
    const googleUser = await fetchGoogleUserInfo(token);
    if (googleUser && googleUser.email) {
      const email = googleUser.email.toLowerCase().trim();
      const rawName = googleUser.name || googleUser.email.split('@')[0];
      const normName = normalizeStaffName(rawName);
      const isAdmin = email === 'richkikim@gmail.com';
      const isKdw = email === 'kdwksm@gmail.com';

      setUser(prev => {
        const updated = {
          ...prev,
          email: email,
          userName: isKdw ? '강대원' : (normName || (prev.userName && prev.email === email ? prev.userName : rawName)),
          name: isKdw ? '강대원' : (normName || rawName),
          picture: googleUser.picture,
          role: isAdmin ? '관리자' : (prev.role || '일반사원'),
          userCode: isKdw ? '101' : (prev.userCode && prev.email === email ? prev.userCode : (isAdmin ? '44' : '')),
          dept: isKdw ? '세종영업본부' : (prev.dept || '세종영업본부'),
          team: isKdw ? '영업2조' : (prev.team || '영업2조'),
          status: '승인완료',
        };
        localStorage.setItem('staff_profile_settings', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

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
            handleLoginSuccess(tokenResponse.access_token);
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
  }, [handleLoginSuccess]);

  // Google 토큰 만료 검사 (세션은 유지)
  useEffect(() => {
    const storedToken = (() => {
      try { return localStorage.getItem('google_access_token'); } catch { return null; }
    })();
    if (!storedToken || !isSessionActive) return;

    fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(storedToken)}`)
      .then(response => {
        if (!response.ok) {
          setAccessToken(null);
          localStorage.removeItem('google_access_token');
        }
      })
      .catch(() => {
        setAccessToken(null);
        localStorage.removeItem('google_access_token');
      });
  }, [isSessionActive]);

  const updateUserProfile = useCallback((newProfile) => {
    setUser(prev => {
      const updated = { ...prev, ...newProfile };
      localStorage.setItem('staff_profile_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

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
              handleLoginSuccess(tokenResponse.access_token);
            }
          },
        })
      : null);

    if (!client) {
      alert('Google Identity Services SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    client.requestAccessToken({ prompt: 'select_account' });
  };

  const logout = () => {
    setAccessToken(null);
    setIsSessionActive(false);
    setUser(emptyProfile);
    try {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('session_active');
      localStorage.removeItem('staff_profile_settings');
    } catch {}
  };

  return (
    <GoogleAuthContext.Provider value={{
      accessToken,
      user,
      updateUserProfile,
      login,
      logout,
      isLoggedIn: Boolean(isSessionActive && user?.email),
    }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export const useGoogleAuth = () => useContext(GoogleAuthContext);