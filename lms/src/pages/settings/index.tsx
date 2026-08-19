import {FormEvent, useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Eye, EyeOff} from 'lucide-react';
import styles from './styles.module.scss';
import type {UpdateProfileRequest} from '@/apis';
import {unwrapData} from '@/apis';
import {authApiService} from '@/apis/services/auth-api';
import {profileApiService} from '@/apis/services/profile-api';
import {useAuth} from '@/contexts/AuthContext';
import {getApiErrorMessage} from '@/utils/apiError';
import {isValidPassword} from '@/utils/passwordRules';

const tabList = ['Account', 'Password', 'Notifications'] as const;
type SettingsTab = (typeof tabList)[number];

interface StatusMessage {
  kind: 'success' | 'error';
  text: string;
}

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Account');
  const [displayName, setDisplayName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
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
    mutationFn: async (changes: UpdateProfileRequest) => unwrapData(
      await profileApiService.updateMyProfile(changes),
      'Update profile',
    ),
    onSuccess: data => {
      queryClient.setQueryData(['my-profile'], data);
      updateProfile({name: data.displayName, avatar: data.avatarUrl});
      setStatus({kind: 'success', text: 'Settings saved.'});
    },
    onError: error => setStatus({kind: 'error', text: getApiErrorMessage(error, 'Could not save settings.')}),
  });

  const changePassword = useMutation({
    mutationFn: () => authApiService.changePassword({currentPassword, newPassword}),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus({kind: 'success', text: 'Password updated.'});
    },
    onError: error => setStatus({kind: 'error', text: getApiErrorMessage(error, 'Could not update password.')}),
  });

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!isValidPassword(newPassword)) {
      setStatus({kind: 'error', text: 'Use at least 8 characters with both letters and numbers.'});
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({kind: 'error', text: 'New passwords do not match.'});
      return;
    }
    changePassword.mutate();
  };

  if (profileQuery.isLoading) return <div className={styles.settingsPageWrapper}>Loading settings…</div>;
  if (profileQuery.isError) {
    return (
      <div className={styles.settingsPageWrapper} role="alert">
        Could not load settings.
        <button type="button" className={styles.primaryButton} onClick={() => void profileQuery.refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const profile = profileQuery.data;
  if (!profile) return <div className={styles.settingsPageWrapper}>Could not load settings.</div>;

  return (
    <div className={styles.settingsPageWrapper}>
      <h2 className={styles.settingsTitle}>Settings</h2>
      <p className={styles.settingsSubtitle}>Manage your Coursistant account and security.</p>
      <div className={styles.tabsContainer} role="tablist" aria-label="Settings sections">
        {tabList.map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? `${styles.tab} ${styles.activeTab}` : styles.tab}
            onClick={() => {
              setActiveTab(tab);
              setStatus(null);
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className={styles.tabDivider}/>
      {status ? (
        <p className={status.kind === 'success' ? styles.successMessage : styles.errorMessage} role="status">
          {status.text}
        </p>
      ) : null}

      {activeTab === 'Account' && (
        <section className={styles.generalSection}>
          <h3 className={styles.generalTitle}>Account</h3>
          <p className={styles.generalSubtitle}>Your email, role, and level are managed by your organization.</p>
          <form
            className={styles.generalForm}
            onSubmit={event => {
              event.preventDefault();
              setStatus(null);
              saveProfile.mutate({displayName: displayName.trim()});
            }}
          >
            <div className={styles.inputGroup}>
              <label htmlFor="displayName">Display name</label>
              <input id="displayName" value={displayName} onChange={event => setDisplayName(event.target.value)} required/>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={profile.email} readOnly aria-readonly="true"/>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="role">Account role</label>
              <input
                id="role"
                value={[profile.role, profile.level].filter(Boolean).join(' · ')}
                readOnly
                aria-readonly="true"
              />
            </div>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={saveProfile.isPending || !displayName.trim()}
            >
              {saveProfile.isPending ? 'Saving…' : 'Save account'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'Password' && (
        <section className={styles.generalSection}>
          <h3 className={styles.generalTitle}>Password</h3>
          <p className={styles.generalSubtitle}>Use at least 8 characters with both a letter and a number.</p>
          <form className={styles.generalForm} onSubmit={submitPassword}>
              <div className={styles.inputGroup}>
                <label htmlFor="currentPassword">Current password</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="currentPassword"
                    type={showOldPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={event => setCurrentPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    aria-label={showOldPassword ? 'Hide current password' : 'Show current password'}
                    onClick={() => setShowOldPassword(value => !value)}
                  >
                    {showOldPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword">New password</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={event => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    onClick={() => setShowNewPassword(value => !value)}
                  >
                    {showNewPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm new password</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword(value => !value)}
                  >
                    {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
            <button type="submit" className={styles.primaryButton} disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'Notifications' && (
        <section className={styles.generalSection}>
          <h3 className={styles.generalTitle}>Email notifications</h3>
          <p className={styles.generalSubtitle}>Choose whether Coursistant may send course notification emails.</p>
          <form
            className={styles.generalForm}
            onSubmit={event => {
              event.preventDefault();
              setStatus(null);
              saveProfile.mutate({emailNotifications});
            }}
          >
            <label className={styles.notificationRow}>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={event => setEmailNotifications(event.target.checked)}
              />
              <span>Receive course and account notification emails</span>
            </label>
            <button type="submit" className={styles.primaryButton} disabled={saveProfile.isPending}>
              {saveProfile.isPending ? 'Saving…' : 'Save notifications'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
};

export default SettingsPage;
