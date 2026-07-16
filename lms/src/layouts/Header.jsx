import {useRef, useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Header.scss';

const Header = () => {
  const {t} = useTranslation();
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
  };
  const name = user?.name;
  const email = user?.email;
  const profileImage = user?.avatar || "/icons/default_avatar.jpg";
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const profileMenuItems = [
    {id: "profile", icon: "/icons/profile-menu/profile.png", label: t("menu.profile"), path: "/profile"},
    {id: "logout", icon: "/icons/profile-menu/logout.png", label: t("menu.signOut")},
  ];
  
  const handleItemClick = (item) => {
    if (item.id === 'logout') {
      logout();
    } else {
      setIsProfileOpen(false);
      navigate(item.path);
    }
  }
  return (
    <div className="lms-home-header">
      <div className="spacer"/>
      <LanguageSwitcher/>
      <div className="profile">
        <img className="profile-avatar" src={profileImage} alt="profile"/>
        <div className="profile-info">
          <p>{name}</p>
          <p className="profile-email">{email}</p>
        </div>
        <div className="profile-arrow-container" ref={menuRef}>
          <img className="profile-arrow" src="/icons/below_arrow.png" alt="down-arrow" onClick={toggleProfile}/>
          {isProfileOpen && (
            <div className="profile-menu">
              {profileMenuItems.map((item, index) => (
                <div className="dropdown-item" key={index} onClick={() => handleItemClick(item)}>
                  <img className="profile-menu-icon" src={item.icon} alt={item.label}/>
                  <p>{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
