import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Icon} from '@iconify/react';
import {useAuth} from "@/contexts/AuthContext";
import {useTranslation} from 'react-i18next';
import {LoginResponse, V2ApiClient} from "@/apis";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const getFieldError = (field: string) => fieldErrors[field] || '';
  const [rememberMe, setRememberMe] = useState(false);
  const API_DOMAIN = import.meta.env.VITE_SIGNUP_API_DOMAIN_NAME;
  const {login} = useAuth();
  
  const navigate = useNavigate();
  const {t} = useTranslation("auth");
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent<any>) => {
      if (event.data && event.data.redirectUrl) {
        navigate(event.data.redirectUrl);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);
  
  useEffect(() => {
    const savedAccount = localStorage.getItem('account');
    if (savedAccount) {
      const parsedAccount = JSON.parse(savedAccount);
      const accessToken = localStorage.getItem('accToken');
      if (parsedAccount.token && accessToken !== null) {
        V2ApiClient.setAccessToken(accessToken);
        navigate('/');
      }
    }
  }, [navigate]);
  
  const handleMicrosoftLogin = async () => {
    try {
      window.location.href = `${API_DOMAIN}/thirdParty/microsoft`;
    } catch (e) {
      console.error("Error getting Microsoft login URL:", e);
    }
  };
  
  const handleLinkedInLogin = async () => {
    try {
      window.location.href = `${API_DOMAIN}/thirdParty/linkedin`;
    } catch (e) {
      console.error("Error getting LinkedIn login URL:", e);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      window.location.href = `${API_DOMAIN}/thirdParty/google`;
    } catch (e) {
      console.error("Error getting Google login URL:", e);
    }
  };
  
  const handleFacebookLogin = async () => {
    try {
      window.location.href = `${API_DOMAIN}/thirdParty/facebook`;
    } catch (e) {
      console.error("Error getting Facebook login URL:", e);
    }
  };
  
  
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    
    try {
      const response = await V2ApiClient.post<LoginResponse>("/login", {
        email,
        password,
        role: 'USER'
      });
      
      if (response.code === 200) {
        login(response.data);
        V2ApiClient.setAccessToken(response.data.nwAccessToken);
        localStorage.setItem('accToken', response.data.nwAccessToken);
        navigate('/');
        return;
      }
      
      if (response.code === 6001) {
        setFieldErrors({password: t("errors.accountLocked")});
      } else if (response.code === 4021) {
        setFieldErrors({email: t("errors.userNotExist")});
      } else if (response.code === 6003) {
        setFieldErrors({password: t("errors.passwordMismatch")});
      }
    } catch (err) {
      console.log('Login Failed', err);
      setFieldErrors({password: t("errors.unexpected")});
    }
  };
  
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white text-gray-900 px-4 overflow-auto">
      <div className="w-full max-w-[1500px] grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 rounded-xl">
        {/* Left side image */}
        <div className="sp-2 flex flex-col items-center justify-center">
          <img src="/icons/login/login-img.png" alt="Coursistant UI"
               className="w-full h-[95%] object-cover rounded-2xl"/>
        </div>
        
        {/* Right side form */}
        <div className="mx-auto flex flex-col justify-center min-h-[600px] w-[512px]">
          <h2 className="text-3xl sm:text-4xl mb-6 text-gray-800">
            {t("login.title")}
          </h2>
          <p className="text-sm text-[#718096] mb-12">
            {t("login.subtitle")}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-2 bg-[#F3F4F8] text-black py-3 rounded-lg text-sm font-normal cursor-pointer">
              <Icon icon="flat-color-icons:google" className="w-5 h-5"/>
              {t("login.socialGoogle")}
            </button>
            <button onClick={handleMicrosoftLogin}
                    className="flex items-center justify-center gap-2 bg-[#F3F4F8] text-black py-3 rounded-lg text-sm font-normal cursor-pointer">
              <Icon icon="logos:microsoft-icon" className="w-5 h-5"/>
              {t("login.socialMicrosoft")}
            </button>
            <button onClick={handleLinkedInLogin}
                    className="flex items-center justify-center gap-2 bg-[#F3F4F8] text-black py-3 rounded-lg text-sm font-normal cursor-pointer">
              <Icon icon="logos:linkedin-icon" className="w-5 h-5"/>
              {t("login.socialLinkedIn")}
            </button>
            <button onClick={handleFacebookLogin}
                    className="flex items-center justify-center gap-2 bg-[#F3F4F8] text-black py-3 rounded-lg text-sm font-normal cursor-pointer">
              <Icon icon="logos:facebook" className="w-5 h-5"/>
              {t("login.socialFacebook")}
            </button>
          </div>
          
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 border-t border-[#E2E8F0]"></div>
            <p className="text-xs text-[#2D3748]">{t("login.dividerText")}</p>
            <div className="flex-1 border-t border-[#E2E8F0]"></div>
          </div>
          
          <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("login.emailPlaceholder")}
              className={`w-full px-4 py-3 rounded-lg bg-white border text-gray-900 text-sm focus:outline-none mb-6 ${getFieldError('email') ? 'border-red-500' : 'border-gray-300 focus:border-[#566FE8]'
              }`}
              required
            />
            {getFieldError('email') && (
              <p className="text-red-400 text-[12px] text-right mt-[-20px]">{getFieldError('email')}</p>
            )}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                className={`w-full px-4 py-3 rounded-lg bg-white border text-gray-900 text-sm focus:outline-none ${getFieldError('password') ? 'border-red-500' : 'border-gray-300 focus:border-[#566FE8]'}`}
                required
              />
              
              <div className="absolute inset-y-0 right-3 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <Icon icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} width={20} height={20}/>
                </button>
              </div>
            </div>
            {getFieldError('password') && (
              <p className="text-red-400 text-[12px] text-right mt-[-0.75rem] mb-6">{getFieldError('password')}</p>
            )}
            
            <div className="flex flex-wrap items-center justify-between text-sm gap-2">
              <label className="flex items-center text-[#A0AEC0]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 border-[#A0AEC0] rounded accent-[#566FE8] cursor-pointer"
                />
                {t("login.rememberForDays")}
              </label>
              <a href="/forgotpassword" className=" text-[14px] text-[#566FE8] text-sm hover:underline">
                {t("login.forgotPassword")}
              </a>
            </div>
            
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-[#566FE8] hover:bg-[#7F9CF5] text-white text-sm mt-8 cursor-pointer"
            >
              {t("login.logIn")}
            </button>
          </form>
          
          <p className="text-sm text-center mt-6">
            {t("login.noAccount")}
            <a href="/signup" className="text-[#566FE8] text-sm ml-1"
               onClick={(event) => {
                 event.preventDefault();
                 navigate('/signup');
               }}>{t("login.signUp")}</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;