import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext.js';

const API_DOMAIN = import.meta.env.VITE_SIGNUP_API_DOMAIN_NAME;

const MicrosoftRerouteHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Checking User Status');
  const { login } = useAuth();
  const hasRun = useRef(false); // 🔒 Prevents multiple runs

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (!code) {
      navigate('/login');
      return;
    }

    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        const response = await axios.post(
          `${API_DOMAIN}/thirdParty/microsoft/continue?authorizationCode=${code}`
        );

        let redirectUrl = '';
        console.log("resp from Microsoft handler:", response);

        if (response.data.data && response.data.code === "4021") {
          const { email, name } = response.data.data;
          localStorage.setItem("socialProvider", "microsoft");
          localStorage.setItem("usernotexistuserEmailMicrosoft", email);
          localStorage.setItem("usernotexistuserNameMicrosoft", name);
          setMessage('You are not registered with us. Please Signup with Coursistant.');
          redirectUrl = '/signupsocialmedia';

        } else if (response.data.data?.id) {
          const accountData = response.data.data;
          const updatedUser = {
            username: accountData.username,
            name: accountData.name,
            email: accountData.email,
            role: accountData.role || 'USER',
            level: accountData.level || '',
            id: accountData.id,
            accessToken: accountData.accessToken || '',
          };

          login(updatedUser);
          setMessage('Login successful! Redirecting you to dashboard...');
          redirectUrl = '/';

        } else {
          setMessage('An error occurred. Redirecting to login.');
          redirectUrl = '/login';
        }

        setTimeout(() => navigate(redirectUrl), 2000);

      } catch (err) {
        console.error("Error calling Microsoft continue API:", err);
        setMessage('An error occurred. Redirecting to login.');
        setTimeout(() => navigate('/login'), 2000);
      }
    })();
  }, [location, navigate, login]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          border: '14px solid #f3f3f3',
          borderTop: '14px solid #2F2F93',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          animation: 'spin 2s linear infinite'
        }}
      />
      <div style={{ marginTop: '20px', fontSize: '18px', textAlign: 'center' }}>
        {message}
      </div>
    </div>
  );
};

export default MicrosoftRerouteHandler;
