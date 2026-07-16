//This version of index.jsx is not in use. Because it didn't use lazy loading method

import React, { useState, useEffect } from 'react';
import AnnouncementModal from './AnnouncementModal';
import CreateAnnouncementModal from './CreateAnnouncementModal';
import axios from 'axios';
//get user timezone
const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

const AnnouncementManager = ({ selectedChatSection, setSelectedChatSection }) => {
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [isHavingContent, setIsHavingContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [userLevel, setUserLevel] = useState('USER');
  const [authToken, setAuthToken] = useState(null);

  const refreshAnnouncements = async (token) => {
    const tz = getBrowserTimeZone();
    const res = await axios.get('https://dash.coursistant.com:8086/api/announcement/selectAll', {
      headers: { token, 'X-Timezone': tz }
    });
    setAnnouncements(res.data?.data ?? []);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await axios.post('https://dash.coursistant.com:8086/api/login', {
          email: '123',
          password: '123',
          role: 'USER'
        });
        const token = response.data?.data?.accessToken;
        const level = response.data?.data?.level ?? 'USER';
        setAuthToken(token);
        setUserLevel(level);
        await refreshAnnouncements(token);
      } catch (e) {
        console.error('announcement fetch failed →', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setShowAnnouncement(selectedChatSection === 'announcement');
  }, [selectedChatSection]);

  const closeAnnouncement = () => {
    setShowAnnouncement(false);
    setShowCreateAnnouncement(false);
    setSelectedChatSection('ai'); // or fallback section
  };

  return (
    <>
      {showAnnouncement && (
        <AnnouncementModal
          loading={loading}
          announcements={announcements}
          onClose={closeAnnouncement}
          canCreate={userLevel === 'TEACHER'}
          onCreate={() => {
            setShowAnnouncement(false);
            setShowCreateAnnouncement(true);
          }}
        />
      )}
      {showCreateAnnouncement && (
        <CreateAnnouncementModal
          onClose={closeAnnouncement}
          setIsHavingContent={setIsHavingContent}
          token={authToken}
          refresh={refreshAnnouncements}
        />
      )}
    </>
  );
};

export default AnnouncementManager;
