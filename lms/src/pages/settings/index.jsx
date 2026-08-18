import {useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {EyeSlash} from 'iconsax-react';
import styles from './styles.module.scss';
import {authApiService} from '@/apis/services/auth-api';
import {profileApiService} from '@/apis/services/profile-api';
import {unwrapData} from '@/apis';
import {useAuth} from '@/contexts/AuthContext';

const tabList = ['Account', 'Password', 'Notifications'];
const errorMessage = (error, fallback) =>
  error?.details?.message || error?.details?.messageEn || error?.message || fallback;

const Settings = () => {
  const [activeTab, setActiveTab] = useState('Account');
  const [displayName, setDisplayName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const queryClient = useQueryClient();
  const {updateProfile} = useAuth();

  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => unwrapData(await profileApiService.getMyProfile(), 'Load profile'),
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setDisplayName(profileQuery.data.displayName || '');
    setEmailNotifications(Boolean(profileQuery.data.emailNotifications));
  }, [profileQuery.data]);

  const saveProfile = useMutation({
    mutationFn: async changes => unwrapData(await profileApiService.updateMyProfile(changes), 'Update profile'),
    onSuccess: data => {
      queryClient.setQueryData(['my-profile'], data);
      updateProfile({name: data.displayName, avatar: data.avatarUrl});
      setStatus({kind: 'success', text: 'Settings saved.'});
    },
    onError: error => setStatus({kind: 'error', text: errorMessage(error, 'Could not save settings.')}),
  });

  const changePassword = useMutation({
    mutationFn: () => authApiService.changePassword({currentPassword, newPassword}),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus({kind: 'success', text: 'Password updated.'});
    },
    onError: error => setStatus({kind: 'error', text: errorMessage(error, 'Could not update password.')}),
  });

  const submitPassword = event => {
    event.preventDefault();
    setStatus(null);
    if (newPassword.length < 8) {
      setStatus({kind: 'error', text: 'New password must be at least 8 characters.'});
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({kind: 'error', text: 'New passwords do not match.'});
      return;
    }
    changePassword.mutate();
  };

  if (profileQuery.isLoading) return <div className={styles.settingsPageWrapper}>Loading settings…</div>;
  if (profileQuery.isError) return <div className={styles.settingsPageWrapper}>Could not load settings.</div>;

  return (
    <div className={styles.settingsPageWrapper}>
      <h2 className={styles.settingsTitle}>Settings</h2>
      <p className={styles.settingsSubtitle}>Manage your Coursistant account and security.</p>
      <div className={styles.tabsContainer} role="tablist" aria-label="Settings sections">
        {tabList.map(tab => (
          <button key={tab} type="button" role="tab" aria-selected={activeTab === tab}
            className={activeTab === tab ? `${styles.tab} ${styles.activeTab}` : styles.tab}
            onClick={() => { setActiveTab(tab); setStatus(null); }}>
            {tab}
          </button>
        ))}
      </div>
      <div className={styles.tabDivider}/>
      {status && <p className={status.kind === 'success' ? styles.successMessage : styles.errorMessage} role="status">{status.text}</p>}

      {activeTab === 'Account' && (
        <section className={styles.generalSection}>
          <h3 className={styles.generalTitle}>Account</h3>
          <p className={styles.generalSubtitle}>Your email, role, and level are managed by your organization.</p>
          <form className={styles.generalForm} onSubmit={event => {
            event.preventDefault();
            setStatus(null);
            saveProfile.mutate({displayName: displayName.trim()});
          }}>
            <div className={styles.inputGroup}><label htmlFor="displayName">Display name</label><input id="displayName" value={displayName} onChange={event => setDisplayName(event.target.value)} required/></div>
            <div className={styles.inputGroup}><label htmlFor="email">Email</label><input id="email" type="email" value={profileQuery.data.email} readOnly aria-readonly="true"/></div>
            <div className={styles.inputGroup}><label htmlFor="role">Account role</label><input id="role" value={[profileQuery.data.role, profileQuery.data.level].filter(Boolean).join(' · ')} readOnly aria-readonly="true"/></div>
            <button type="submit" className={styles.primaryButton} disabled={saveProfile.isPending || !displayName.trim()}>{saveProfile.isPending ? 'Saving…' : 'Save account'}</button>
          </form>
        </section>
      )}

      {activeTab === 'Password' && (
        <section className={styles.generalSection}>
          <h3 className={styles.generalTitle}>Password</h3>
          <p className={styles.generalSubtitle}>Use your current password to set a new one.</p>
          <form className={styles.generalForm} onSubmit={submitPassword}>
            <div className={styles.inputGroup}><label htmlFor="currentPassword">Current password</label><div className={styles.inputIconLeft}><EyeSlash size={20} onClick={() => setShowOldPassword(value => !value)}/><input id="currentPassword" type={showOldPassword ? 'text' : 'password'} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required autoComplete="current-password"/></div></div>
            <div className={styles.inputGroup}><label htmlFor="newPassword">New password</label><div className={styles.inputIconLeft}><EyeSlash size={20} onClick={() => setShowNewPassword(value => !value)}/><input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={event => setNewPassword(event.target.value)} required minLength={8} autoComplete="new-password"/></div></div>
            <div className={styles.inputGroup}><label htmlFor="confirmPassword">Confirm new password</label><input id="confirmPassword" type={showNewPassword ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password"/></div>
            <button type="submit" className={styles.primaryButton} disabled={changePassword.isPending}>{changePassword.isPending ? 'Updating…' : 'Update password'}</button>
          </form>
        </section>
      )}

      {activeTab === 'Notifications' && (
        <section className={styles.generalSection}>
          <h3 className={styles.generalTitle}>Email notifications</h3>
          <p className={styles.generalSubtitle}>Choose whether Coursistant may send course notification emails.</p>
          <form className={styles.generalForm} onSubmit={event => { event.preventDefault(); setStatus(null); saveProfile.mutate({emailNotifications}); }}>
            <label className={styles.notificationRow}><input type="checkbox" checked={emailNotifications} onChange={event => setEmailNotifications(event.target.checked)}/><span>Receive course and account notification emails</span></label>
            <button type="submit" className={styles.primaryButton} disabled={saveProfile.isPending}>{saveProfile.isPending ? 'Saving…' : 'Save notifications'}</button>
          </form>
        </section>
      )}
    </div>
  );
};

export default Settings;
