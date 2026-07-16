import {useNavigate} from 'react-router-dom';
import {useState} from 'react';
import axios from 'axios';


export default function SignupSocialMedia() {
  const navigate = useNavigate();
  const API_DOMAIN = import.meta.env.VITE_SIGNUP_API_DOMAIN_NAME;
  
  const [nickname, setNickname] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setError] = useState('');
  const [, setSuccess] = useState('');
  const [showOtpScreen] = useState(false);
  
  const getValidValue = (key, defaultVal) => {
    const value = localStorage.getItem(key);
    return !value || value === 'null' || value === 'undefined' || value.trim() === ''
      ? defaultVal
      : value;
  };
  
  const provider = localStorage.getItem('socialProvider');
  let unename = null;
  let uneemail = null;
  
  switch (provider) {
    case 'facebook':
      unename = getValidValue('usernotexistuserNameFacebook', 'facebook user');
      uneemail = getValidValue('usernotexistuserEmailFacebook', '');
      break;
    case 'linkedin':
      unename = getValidValue('usernotexistuserNameLinkedIn', 'linkedin user');
      uneemail = getValidValue('usernotexistuserEmailLinkedIn', '');
      break;
    case 'google':
      unename = getValidValue('usernotexistuserNameGoogle', 'google user');
      uneemail = getValidValue('usernotexistuserEmailGoogle', '');
      break;
    case 'microsoft':
      unename = getValidValue('usernotexistuserNameMicrosoft', 'microsoft user');
      uneemail = getValidValue('usernotexistuserEmailMicrosoft', '');
      break;
    default:
      break;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(`${API_DOMAIN}/thirdParty/register`, {
        email: uneemail,
        invitation: invitationCode,
        level: 'TEACHER',
        name: unename,
        role: 'USER',
        username: nickname,
      }, {
        headers: {'Content-Type': 'application/json'},
      });
      
      if (response.data.msg === 'Invitation Not Exist') {
        setError('Invalid invitation code. Please try again.');
      } else if (response.data.msg === 'Success') {
        localStorage.clear();
        setTimeout(() => {
          alert('Signup successful! Please login to continue');
          navigate('/login');
        }, 1500);
      } else {
        setError(response.data?.msg || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 px-4">
      <div
        className="w-full max-w-[1500px] grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 rounded-xl overflow-hidden ml-[-28px]">
        
        <div className="sp-2 flex flex-col items-center justify-center">
          <img src="/icons/login/login-img.png" alt="Coursistant UI"
               className="w-full h-[95%] object-cover rounded-2xl"/>
        </div>
        
        <div className="p-8 sm:p-10 ml-25 flex flex-col justify-top min-h-[600px] h-[90%] mt-10 w-[512px]">
          <form onSubmit={handleSubmit} className="w-full">
            <a href="/signup" className="text-[#A0AEC0] mb-12 block">← Back to</a>
            <h1 className="text-3xl sm:text-4xl mb-5">Create an account 👋</h1>
            <p className="text-sm text-[#718096] mb-12">Describe yourself as clearly so that there are no mistakes</p>
            
            <div className="space-y-5">
              <input
                type="text"
                name="Nickname"
                placeholder="Enter nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:border-[#566FE8] focus:outline-none mb-6"
              />
              <input
                type="text"
                name="Invitecode"
                placeholder="Enter the invitation code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:border-[#566FE8] focus:outline-none mb-45"
              />
            </div>
            
            <button
              type="submit"
              className="w-full mt-32 py-3 rounded-xl text-white bg-[#566FE8] hover:bg-[#7F9CF5] cursor-pointer active:bg-indigo-600 transition"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Complete Signup'}
            </button>
          </form>
          
          <p className="text-sm text-center mt-6">
            {showOtpScreen ? (
              <>Didn&apos;t receive the email? <a href="#" className="text-blue-500 hover:underline">Click to
                resend</a></>
            ) : (
              <>Already registered? <a href="/login" className="text-[#566FE8]">Sign in</a></>
            )}
          </p>
        </div>
      </div>
    </div>
  
  );
}
