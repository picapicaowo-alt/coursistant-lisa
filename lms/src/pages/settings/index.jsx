import styles from "./styles.module.scss";
import { useState } from "react";
import { Calendar2, EyeSlash } from 'iconsax-react';
import CancellationModal from "./cancellationModal";
import ConfirmCancellation from "./confirmCancellation";

const tabList = ["Account", "Password", "Subscription", "Notifications"];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Account");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    projectFeedback: true,
    newContent: true,
    designTips: true,
    specialPromotions: true,
    weeklySummary: true,
  });
  const [unsubscribeAll, setUnsubscribeAll] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showConfirmCancellationModal, setShowConfirmCancellationModal] = useState(false);

  return (
    <div className={styles.settingsPageWrapper}>
      <h2 className={styles.settingsTitle}>Settings</h2>
      <p className={styles.settingsSubtitle}>
        Manage and update your Coursistant account info
      </p>
      <div className={styles.tabsContainer}>
        {tabList.map((tab) => (
          <button
            key={tab}
            className={
              activeTab === tab
                ? `${styles.tab} ${styles.activeTab}`
                : styles.tab
            }
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className={styles.tabDivider} />
      {activeTab === "Account" && (
        <div className={styles.generalSection}>
          <button type="submit" className={styles.saveButton}>
            Save
          </button>
          <h3 className={styles.generalTitle}>General</h3>
          <p className={styles.generalSubtitle}>Update your account settings.</p>
          <form className={styles.generalForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </form>
        </div>
      )}
      {activeTab === "Password" && (
        <div className={styles.generalSection}>
          <button type="submit" className={styles.saveButton}>
            Save
          </button>
          <h3 className={styles.generalTitle}>Password</h3>
          <p className={styles.generalSubtitle}>
            Update your password to ensure your account remains private and secure.
          </p>
          <form className={styles.generalForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="oldPassword">Old password</label>
              <div className={styles.inputIconLeft}>
                <EyeSlash 
                  size={20} 
                  color="#2D3748" 
                  variant="Linear"
                  onClick={() => setShowOldPassword((v) => !v)}
                  style={{ cursor: 'pointer' }}
                />
                <input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  placeholder=""
                />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="newPassword">New password</label>
              <div className={styles.inputIconLeft}>
                <EyeSlash 
                  size={20} 
                  color="#2D3748" 
                  variant="Linear"
                  onClick={() => setShowNewPassword((v) => !v)}
                  style={{ cursor: 'pointer' }}
                />
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder=""
                />
              </div>
            </div>
          </form>
        </div>
      )}
      {activeTab === "Notifications" && (
        <div className={styles.generalSection}>
          <button type="submit" className={styles.saveButton}>
            Save
          </button>
          <h3 className={styles.generalTitle}>Email</h3>
          <p className={styles.generalSubtitle}>
            Customize your email notifications and make sure you never miss a beat.
          </p>
          <form className={styles.generalForm}>
            <div className={styles.inputGroup}>
              <div className={styles.notificationRow}>
                <div className={styles.notificationCheckbox}>
                  <input
                    type="checkbox"
                    checked={notifications.projectFeedback}
                    onChange={() => setNotifications(n => ({ ...n, projectFeedback: !n.projectFeedback }))}
                    style={{ accentColor: '#566FE8' }}
                  />
                </div>
                <div className={styles.notificationContent}>
                  Project feedback<br />
                  <span style={{ color: '#A0AEC0', fontWeight: 400 }}>
                    Get notified whenever your project reviews a new review from the community.
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.notificationRow}>
                <div className={styles.notificationCheckbox}>
                  <input
                    type="checkbox"
                    checked={notifications.newContent}
                    onChange={() => setNotifications(n => ({ ...n, newContent: !n.newContent }))}
                    style={{ accentColor: '#566FE8' }}
                  />
                </div>
                <div className={styles.notificationContent}>
                  New Content Announcements<br />
                  <span style={{ color: '#A0AEC0', fontWeight: 400 }}>
                    Get all the latest updates on all new content releases and product features.
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.notificationRow}>
                <div className={styles.notificationCheckbox}>
                  <input
                    type="checkbox"
                    checked={notifications.designTips}
                    onChange={() => setNotifications(n => ({ ...n, designTips: !n.designTips }))}
                    style={{ accentColor: '#566FE8' }}
                  />
                </div>
                <div className={styles.notificationContent}>
                  Design Tips & Tricks<br />
                  <span style={{ color: '#A0AEC0', fontWeight: 400 }}>
                    Make the most of your Uxcel learning experience with practical design & product-related tips.
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.notificationRow}>
                <div className={styles.notificationCheckbox}>
                  <input
                    type="checkbox"
                    checked={notifications.specialPromotions}
                    onChange={() => setNotifications(n => ({ ...n, specialPromotions: !n.specialPromotions }))}
                    style={{ accentColor: '#566FE8' }}
                  />
                </div>
                <div className={styles.notificationContent}>
                  Special Promotions<br />
                  <span style={{ color: '#A0AEC0', fontWeight: 400 }}>
                    Who doesn't love discounts? We'll often send special offers that you surely don't want to miss.
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <div className={styles.notificationRow}>
                <div className={styles.notificationCheckbox}>
                  <input
                    type="checkbox"
                    checked={notifications.weeklySummary}
                    onChange={() => setNotifications(n => ({ ...n, weeklySummary: !n.weeklySummary }))}
                    style={{ accentColor: '#566FE8' }}
                  />
                </div>
                <div className={styles.notificationContent}>
                  Weekly Progress Summary<br />
                  <span style={{ color: '#A0AEC0', fontWeight: 400 }}>
                    Keep track of your course progress and receive an informative weekly report.
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.inputGroup} style={{ borderTop: '1px solid #E2E8F0', marginTop: '2rem', paddingTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                <span style={{ flex: 1 }}>
                  <strong>Unsubscribe From Everything</strong><br />
                  <span style={{ color: '#A0AEC0', fontWeight: 400 }}>
                    We'll continue to only send necessary emails about your account.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={unsubscribeAll}
                  onChange={() => setUnsubscribeAll(v => !v)}
                  style={{ width: 40, height: 20, accentColor: '#A0AEC0' }}
                />
              </label>
            </div>
          </form>
        </div>
      )}
      {activeTab === "Subscription" && (
        <div style={{ width: '100%', maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Plan Card */}
          <div style={{ background: '#fff', borderRadius: 15, border: '1px solid #E2E8F0', padding: '2rem', position: 'relative', boxShadow: '0 1px 6px 0 rgba(0,0,0,0.03)' }}>
            <button 
              onClick={() => setShowCancellationModal(true)}
              style={{ position: 'absolute', top: 24, right: 24, border: '1px solid #CBD5E0', borderRadius: 8, background: '#F7FAFC', color: '#A0AEC0', padding: '0.5rem 1.25rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Cancel Subscription
            </button>
            <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Plan</h3>
            <p style={{ color: '#A0AEC0', fontSize: 16, marginBottom: 24 }}>A look at your subscription and billing information.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 24 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <img src="/icons/settings/frequency.png" alt="frequency" style={{ width: 20, height: 20 }} /> Frequency: Monthly
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Calendar2 size={20} color="#2D3748" variant="Linear" /> Next billing date: April 3, 2025
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="/icons/settings/wallet.png" alt="amount" style={{ width: 20, height: 20 }} /> Amount: $14.99
              </li>
            </ul>
            <div style={{ borderTop: '1px solid #E2E8F0', margin: '1.5rem 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ color: '#A0AEC0', fontSize: 16, flex: 1 }}>Upgrade to Yearly and save $50 per year.</span>
              <button style={{ background: '#566FE8', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontWeight: 500, cursor: 'pointer' }}>Upgrade</button>
            </div>
          </div>

          {/* Saved Payment Methods Card */}
          <div style={{ background: '#fff', borderRadius: 15, border: '1px solid #E2E8F0', padding: '2rem', position: 'relative', boxShadow: '0 1px 6px 0 rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Saved Payment Methods</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#fff', border: '1px solid #CBD5E0', borderRadius: 4, padding: '2px 8px', fontWeight: 600, fontSize: 14, color: '#566FE8', marginRight: 8 }}>VISA</span>
                <span style={{ fontSize: 16, color: '#2D3748' }}>VISA **** 7683</span>
              </div>
              <button style={{ border: '1px solid #CBD5E0', borderRadius: 8, background: '#F7FAFC', color: '#A0AEC0', padding: '0.5rem 1.25rem', fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>

          {/* Billing History Card */}
          <div style={{ background: '#fff', borderRadius: 15, border: '1px solid #E2E8F0', padding: '2rem', position: 'relative', boxShadow: '0 1px 6px 0 rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Billing History</h3>
              <button style={{ border: '1px solid #CBD5E0', borderRadius: 8, background: '#F7FAFC', color: '#566FE8', padding: '0.5rem 1.25rem', fontWeight: 500, cursor: 'pointer' }}>Download All</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr style={{ color: '#A0AEC0', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '8px 0' }}>Invoice</th>
                  <th style={{ padding: '8px 0' }}>Amount</th>
                  <th style={{ padding: '8px 0' }}>Date</th>
                  <th style={{ padding: '8px 0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '8px 0' }}>Plus (monthly)</td>
                  <td style={{ padding: '8px 0' }}>$14.99</td>
                  <td style={{ padding: '8px 0' }}>April 2, 2025</td>
                  <td style={{ padding: '8px 0' }}>
                    <span style={{ background: '#566FE8', color: '#fff', borderRadius: 6, padding: '2px 12px', fontWeight: 500, fontSize: 14, marginRight: 8 }}>Paid</span>
                    <span style={{ background: '#F7FAFC', color: '#566FE8', borderRadius: 6, padding: '2px 12px', fontWeight: 500, fontSize: 14 }}>Awaiting</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0' }}>Plus (monthly)</td>
                  <td style={{ padding: '8px 0' }}>$14.99</td>
                  <td style={{ padding: '8px 0' }}>April 2, 2025</td>
                  <td style={{ padding: '8px 0' }}>
                    <span style={{ background: '#566FE8', color: '#fff', borderRadius: 6, padding: '2px 12px', fontWeight: 500, fontSize: 14, marginRight: 8 }}>Paid</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Cancellation Modal */}
      {showCancellationModal && (
        <CancellationModal 
          onClose={() => setShowCancellationModal(false)} 
          onShowConfirm={() => {
            setShowCancellationModal(false);
            setShowConfirmCancellationModal(true);
          }}
        />
      )}
      {/* Confirm Cancellation Modal */}
      {showConfirmCancellationModal && (
        <ConfirmCancellation 
          onClose={() => setShowConfirmCancellationModal(false)}
          onConfirm={() => {
            // Handle the actual cancellation logic here
            console.log('Subscription cancelled');
            alert('Your subscription has been cancelled successfully!');
            setShowConfirmCancellationModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Settings;
