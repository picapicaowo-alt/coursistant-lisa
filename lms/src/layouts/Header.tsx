import {ReactNode, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../contexts/AuthContext';
import NotificationCenter from '../components/NotificationCenter';
import './Header.scss';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  path?: string;
}

interface HeaderProps {
  children?: ReactNode;
}

const Header = ({children}: HeaderProps) => {
  const {t} = useTranslation();
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const name = user?.name;
  const email = user?.email;
  const profileImage = user?.avatar || '/icons/default_avatar.jpg';
  const canUseAdminConsole = user?.role === 'SYSTEM_ADMIN' || user?.role === 'TENANT_ADMIN';

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const profileMenuItems: MenuItem[] = [
    {id: 'profile', icon: '/icons/profile-menu/profile.png', label: t('menu.profile'), path: '/profile'},
    {id: 'settings', icon: '/icons/profile-menu/setting.png', label: t('menu.settings'), path: '/settings'},
    ...(canUseAdminConsole
      ? [{id: 'admin', icon: '/icons/profile-menu/setting.png', label: 'Admin Console', path: '/admin'}]
      : []),
    {id: 'logout', icon: '/icons/profile-menu/logout.png', label: t('menu.signOut')},
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.id === 'logout') {
      void logout();
      return;
    }
    setIsProfileOpen(false);
    if (item.path) navigate(item.path);
  };

  return (
    <header className="lms-home-header app-shell-header">
      {children ? <div className="dashboard-search-slot">{children}</div> : <div className="spacer"/>}
      {user?.role === 'USER' && <NotificationCenter/>}
      <div className="profile">
        <img
          className="profile-avatar"
          src={profileImage}
          alt="profile"
          onError={event => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/icons/default_avatar.jpg';
          }}
        />
        <div className="profile-info">
          <p>{name}</p>
          <p className="profile-email">{email}</p>
        </div>
        <div className="profile-arrow-container" ref={menuRef}>
          <button
            type="button"
            className="profile-arrow-button"
            onClick={() => setIsProfileOpen(open => !open)}
            aria-label={t('menu.profile')}
            aria-expanded={isProfileOpen}
          >
            <img className="profile-arrow" src="/icons/below_arrow.png" alt=""/>
          </button>
          {isProfileOpen && (
            <div className="profile-menu">
              {profileMenuItems.map(item => (
                <button type="button" className="dropdown-item" key={item.id} onClick={() => handleItemClick(item)}>
                  <img className="profile-menu-icon" src={item.icon} alt=""/>
                  <p>{item.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
