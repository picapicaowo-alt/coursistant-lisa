import {useRef, useState, useEffect} from 'react';
import ProgressBar from './ProgressBar';
import {useNavigate} from 'react-router-dom';
import {useLocation} from 'react-router-dom';
import {Icon} from '@iconify/react';
import {useTranslation} from 'react-i18next';  //Used for multi-language
import {authApiService} from '@/apis/services/auth-api';


export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const forcedFromQuery = qs.get('forced') === '1';
  const emailFromQuery = qs.get('email') || '';
  
  const forcedState = location.state?.forced === true || forcedFromQuery;
  const forcedEmail = location.state?.email || emailFromQuery;
  const [emailid, setEmail] = useState('');
  const [passwordfield, setPassword] = useState('');
  const [passwordfieldnew, setPasswordNew] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [showNewPasswordScreen, setNewPasswordScreen] = useState(false);
  const [showSuccessPasswordScreen, setSuccessPasswordScreen] = useState(false);
  const inputRefs = useRef([]);
  
  const [otpError, setOtpError] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  //used for multi-language
  const {t} = useTranslation("auth");
  
  
  useEffect(() => {
    if (forcedState && forcedEmail) {
      setEmail(forcedEmail);
      setShowOtpScreen(true);
      setError('');
      setOtpError(false);
    }
  }, [forcedState, forcedEmail]);
  
  // Determine the current progress step based on which screen is showing
  let currentStep;
  if (showSuccessPasswordScreen) {
    currentStep = 4;
  } else if (showNewPasswordScreen) {
    currentStep = 3;
  } else if (showOtpScreen) {
    currentStep = 2;
  } else {
    currentStep = 1;
  }
  
  const handleChange = (setter) => (e) => {
    setter(e.target.value);
  };
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };
  
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
  };
  
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  const backtoresetpassword = async () => {
    setShowOtpScreen(false)
    setVerificationCode(''); // Clear OTP input
    setOtpError(false); // Clear OTP error state
    setError(''); // Clear any error messages
  }
  
  const backtootpscreen = async () => {
    setShowOtpScreen(true)
    setNewPasswordScreen(false)
    setPassword(''); // Clear new password input
    setPasswordNew(''); // Clear confirm password input
    setPasswordError(''); // Clear password error
    setConfirmPasswordError(''); // Clear confirm password error
    setError('');
    setVerificationCode(''); // Clear OTP input
  }
  
  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.trim() === "") {
      setError(t("forgotPasswordErrors.codeRequired"));
      setOtpError(true);
      return;
    }
    setOtpError(false);
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    // The current API consumes and validates the code atomically when the
    // password is reset. Keep it locally until the user enters a new password.
    setNewPasswordScreen(true);
    setShowOtpScreen(false);
    setLoading(false);
  };
  
  const handleSuccessScreen = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Check if passwords are empty
    if (!passwordfield || passwordfield.trim() === "") {
      setPasswordError(t("forgotPasswordErrors.passwordRequired"));
      return;
    }
    
    // Check password length first
    if (passwordfield.length < 8) {
      setPasswordError(t("forgotPasswordErrors.passwordTooShort"));
      return;
    }
    
    if (!passwordfieldnew || passwordfieldnew.trim() === "") {
      setConfirmPasswordError(t("forgotPasswordErrors.confirmPasswordRequired"));
      return;
    }
    
    // Check if passwords match
    if (passwordfield !== passwordfieldnew) {
      setConfirmPasswordError(t("forgotPasswordErrors.passwordsDontMatch"));
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await authApiService.resetPassword({
        email: emailid,
        verificationCode,
        newPassword: passwordfield,
      });
      setNewPasswordScreen(false);
      setSuccessPasswordScreen(true);
    } catch (err) {
      console.error(err);
      setError(t("forgotPasswordErrors.updateError"));
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetButton = async () => {
    // Reset any previous messages and start loading
    if (!emailid || emailid.trim() === "") {
      setError(t("forgotPasswordErrors.emailRequired"));
      return;
    }
    
    // Reset OTP state when resending
    setVerificationCode(''); // Clear OTP input
    setOtpError(false); // Clear OTP error state
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await authApiService.sendPasswordResetVerification(emailid.trim());
      setShowOtpScreen(true);
    } catch (err) {
      console.error(err);
      setError(t("forgotPasswordErrors.sendVerificationFailed"));
    } finally {
      setLoading(false);
    }
  };
  
  const renderForm = (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col items-start justify-center">
        <h1 className="text-4xl font-medium mb-2">
          {t("forgotPassword.title")}
        </h1>
        <p className="text-[#718096] text-sm mb-5 mt-3">
          {t("forgotPassword.subtitle")}
        </p>
      </div>
      
      <div className="space-y-4 mt-6">
        <div>
          <input
            type="email"
            name="Email"
            placeholder={t("forgotPassword.emailPlaceholder")}
            value={emailid}
            onChange={handleChange(setEmail)}
            required
            readOnly={forcedState}
            disabled={forcedState}
            className={
              "w-full px-3 py-3 text-sm border rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#566FE8] focus:border-transparent " +
              (error ? "border-[#F56565]" : "border-gray-300")
            }
          />
          {error && (
            <p className="text-[#F56565] text-sm mt-2 mr-2 text-right">
              {error}
            </p>
          )}
        </div>
      </div>
      
      {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
      
      <button
        type="button"
        onClick={handleResetButton}
        disabled={loading}
        className="w-full mt-8 py-3 px-4 bg-[#566FE8] hover:bg-[#7F9CF5] active:bg-indigo-500 text-white font-medium rounded-2xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {t("forgotPassword.loading")}
          </div>
        ) : (
          t("forgotPassword.resetButton")
        )}
      </button>
    </form>
  );
  
  return (
    <div>
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 px-4">
        <div
          className="w-full max-w-[1500px] grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 rounded-xl overflow-hidden">
          {/* Left Section */}
          <div className="sp-2 flex flex-col items-center justify-center">
            <img src="/icons/login/login-img.png" alt="Coursistant UI"
                 className="w-full h-[95%] object-cover rounded-2xl"/>
          </div>
          
          {/* Right Section */}
          <div className="flex-1 flex flex-col items-center justify-between bg-white mt-12 p-12">
            <div className="w-full max-w-md">
              
              {!forcedState && !showOtpScreen && !showNewPasswordScreen && !showSuccessPasswordScreen && (
                <>
                  <a
                    href="/login"
                    className="block mb-12 text-[#A0AEC0] cursor-pointer hover:text-gray-400 text-sm"
                  >
                    {t("forgotPassword.backToLogin")}
                  </a>
                  {renderForm}
                  <p className="text-sm text-center text-[#A0AEC0] mt-4 mb-12">
                    {t("forgotPassword.newUser")}
                    <a
                      href="/signup"
                      className="ml-1 text-[#566FE8] underline hover:text-red font-medium"
                    >
                      {t("forgotPassword.createAccountLink")}
                    </a>
                  </p>
                </>
              )}
              
              {showOtpScreen && (
                <>
                  <div className="flex flex-col items-start justify-center">
                    {!forcedState && (
                      <button
                        onClick={backtoresetpassword}
                        className="block mb-12 hover:text-gray-400 text-sm text-[#A0AEC0] cursor-pointer"
                      >
                        {t("forgotPassword.backToLogin")}
                      </button>
                    )}
                    <h1 className="text-3xl lg:text-4xl font-medium mb-2">
                      {t("forgotPassword.otpTitle")}
                    </h1>
                    <p className="text-[#718096] text-sm mb-6 w-4/5">
                      {t("forgotPassword.otpSubtitlePrefix")} <span className='text-[#2D3748]'>{emailid}</span>
                    </p>
                  </div>
                  
                  <div className="flex justify-start gap-3 mb-3">
                    {[...Array(6)].map((_, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        maxLength={1}
                        className={
                          `w-15 h-19 text-center text-xl border rounded-lg focus:outline-none focus:ring-1 focus:border-transparent
                              ${otpError ? 'border-[#F56565]' : verificationCode[index] ? 'border-[#566FE8]' : 'border-[#E2E8F0]'}
                              ${verificationCode[index] ? 'focus:ring-[#566FE8]' : 'focus:ring-[#566FE8]'}`
                        }
                        value={verificationCode[index] || ""}
                        onChange={(e) => {
                          const newCodeArray = verificationCode.split("");
                          newCodeArray[index] = e.target.value;
                          setVerificationCode(newCodeArray.join(""));
                          
                          if (e.target.value) {
                            setError('');
                            setOtpError(false);
                          }
                          
                          if (e.target.value && index < inputRefs.current.length - 1) {
                            inputRefs.current[index + 1].focus();
                          }
                        }}
                        onFocus={() => {
                          setError('');
                          setOtpError(false);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                      />
                    ))}
                  </div>
                  {error && (
                    <p className="text-[#F56565] text-sm mb-4 mr-8 text-right">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={handleVerifyEmail}
                    disabled={loading}
                    className="w-[95%] py-3 px-4 mt-4 bg-[#566FE8] cursor-pointer hover:bg-[#7F9CF5] active:bg-indigo-500 text-white font-medium rounded-2xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("forgotPassword.loading")}
                      </div>
                    ) : (
                      t("forgotPassword.verifyButton")
                    )}
                  </button>
                  
                  <p className="text-sm text-[#A0AEC0] text-center mt-4 mb-12">
                    {t("forgotPassword.noEmailText")}
                    <button
                      onClick={handleResetButton}
                      className="ml-1 text-[#566FE8] underline hover:text-[#718096] font-medium cursor-pointer"
                    >
                      {t("forgotPassword.resendLink")}
                    </button>
                  </p>
                </>
              )}
              
              {showNewPasswordScreen && (
                <>
                  <div className="flex flex-col items-start justify-center">
                    <button
                      onClick={backtootpscreen}
                      className="block mb-12 text-[#A0AEC0] cursor-pointer hover:text-gray-400 text-sm"
                    >
                      {t("forgotPassword.backToLogin")}
                    </button>
                    <h1 className="text-3xl lg:text-4xl font-medium mb-2">
                      {t("forgotPassword.newPasswordTitle")}
                    </h1>
                    <p className="text-[#718096] text-sm mt-2 mb-10 w-4/5">
                      {t("forgotPassword.newPasswordSubtitle")}
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder={t("forgotPassword.newPasswordPlaceholder")}
                        value={passwordfield}
                        onChange={handlePasswordChange}
                        required
                        className={
                          "w-full px-3 py-3 text-sm border rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#566FE8] focus:border-transparent pr-12 " +
                          (passwordError ? "border-[#F56565]" : "border-gray-300")
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <Icon className="cursor-pointer" icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'}
                              width={20} height={20}/>
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-[#F56565] mt-[-16px] text-sm text-right">
                        {passwordError}
                      </p>
                    )}
                    
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder={t("forgotPassword.confirmPasswordPlaceholder")}
                        value={passwordfieldnew}
                        onChange={handleChange(setPasswordNew)}
                        required
                        className={
                          "w-full px-3 py-3 text-sm border rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#566FE8] focus:border-transparent pr-12 " +
                          (confirmPasswordError ? "border-[#F56565]" : "border-gray-300")
                        }
                        onFocus={() => {
                          // Clear errors when focusing
                          setPasswordError('');
                          setConfirmPasswordError('');
                          
                          // Validate password length when moving to confirm field
                          if (passwordfield && passwordfield.length >= 8) {
                            setPasswordError('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <Icon className="cursor-pointer"
                              icon={showConfirmPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} width={20} height={20}/>
                      </button>
                    </div>
                  </div>
                  {confirmPasswordError && (
                    <p className="text-[#F56565] mt-2 text-sm text-right">
                      {confirmPasswordError}
                    </p>
                  )}
                  <button
                    onClick={handleSuccessScreen}
                    disabled={loading}
                    className="w-full mt-8 py-3 px-4 bg-[#566FE8] cursor-pointer hover:bg-[#7F9CF5] active:bg-indigo-500 text-white font-medium rounded-2xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("forgotPassword.loading")}
                      </div>
                    ) : (
                      t("forgotPassword.resetPasswordButton")
                    )}
                  </button>
                </>
              )}
              
              {showSuccessPasswordScreen && (
                <>
                  <div className="flex flex-col items-start justify-center">
                    
                    <h1 className="text-3xl lg:text-4xl font-medium mb-2">
                      {t("forgotPassword.successTitle")}
                    </h1>
                    <p className="text-[#718096] text-sm mt-2 mb-4">
                      {t("forgotPassword.successSubtitle")}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigate("/login")}
                    disabled={loading}
                    className="w-full mt-8 py-3 px-4 bg-[#566FE8] hover:bg-[#7F9CF5] cursor-pointer active:bg-indigo-500 text-white font-medium rounded-2xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t("forgotPassword.loading")}
                      </div>
                    ) : (
                      t("forgotPassword.loginButton")
                    )}
                  </button>
                </>
              )}
            </div>
            <ProgressBar step={currentStep}/>
          </div>
        </div>
      </div>
    </div>
  );
}
