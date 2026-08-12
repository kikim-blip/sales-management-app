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
  const [accessToken, setAccessToken] = useState(localStorage.getItem('google_access_token') || null);
  
  // 💡 사원 프로필 설정은 토큰 로그아웃과 독립적으로 영구 유지
  const savedProfile = JSON.parse(localStorage.getItem('staff_profile_settings'));
  const [user, setUser] = useState(savedProfile ? { ...defaultProfile, ...savedProfile } : defaultProfile);

  useEffect(() => {
    /* global google */
    if (window.google && CLIENT_ID) {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            const token = tokenResponse.access_token;
            setAccessToken(token);
            localStorage.setItem('google_access_token', token);

            setUser(prev => {
              const updated = {
                ...prev,
                name: prev.userName || '구글 사용자',
              };
              localStorage.setItem('staff_profile_settings', JSON.stringify(updated));
              return updated;
            });
          }
        },
      });
      setTokenClient(client);
    }
  }, []);

  const updateUserProfile = (newProfile) => {
    setUser(prev => {
      const updated = { ...prev, ...newProfile };
      localStorage.setItem('staff_profile_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const login = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      alert('Google Identity Services SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('google_access_token');
    // 💡 사용자 프로필(staff_profile_settings)은 삭제하지 않고 유지함!
  };

  return (
    <GoogleAuthContext.Provider value={{ accessToken, user, updateUserProfile, login, logout, isLoggedIn: !!accessToken }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export const useGoogleAuth = () => useContext(GoogleAuthContext);