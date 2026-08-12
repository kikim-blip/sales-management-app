// src/context/GoogleAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const GoogleAuthContext = createContext();

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

const defaultProfile = {
  userCode: '84',
  userName: '홍길동',
  companyCode: '3',
  email: 'richkikim@gmail.com',
};

export function GoogleAuthProvider({ children }) {
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('google_access_token') || null);
  
  const savedUser = JSON.parse(localStorage.getItem('google_user_info'));
  const [user, setUser] = useState(savedUser ? { ...defaultProfile, ...savedUser } : defaultProfile);

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
                email: '사용자 인증됨',
              };
              localStorage.setItem('google_user_info', JSON.stringify(updated));
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
      localStorage.setItem('google_user_info', JSON.stringify(updated));
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
    setUser(defaultProfile);
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_user_info');
  };

  return (
    <GoogleAuthContext.Provider value={{ accessToken, user, updateUserProfile, login, logout, isLoggedIn: !!accessToken }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export const useGoogleAuth = () => useContext(GoogleAuthContext);