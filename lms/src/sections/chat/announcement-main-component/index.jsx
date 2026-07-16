//AnnouncementManager for lazy loading, keeps state, shows the modals
import { useState, useEffect } from 'react';
import axios from 'axios';
import AnnouncementModal from './AnnouncementModal';
import CreateAnnouncementModal from './CreateAnnouncementModal';
import { useAuth } from '../../../contexts/AuthContext.js';
const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';

export default function AnnouncementManager({ selectedChatSection, setSelectedChatSection, }) {
    const [showAnnouncement, setShowAnnouncement] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [authToken, setAuthToken] = useState(null);
    const [userLevel, setUserLevel] = useState('USER');
    const [loading, setLoading] = useState(false);
    const VITE_ANNOUNCEMENT_API_DOMAIN_NAME = import.meta.env.VITE_ANNOUNCEMENT_API_DOMAIN_NAME; 
    const { user } = useAuth();

    //lazy loading
    useEffect(() => {
        const opened = selectedChatSection === 'announcement';
        setShowAnnouncement(opened);

        if (!opened) return; // user not in Announcement
        if (announcements.length) return; // already have data

        (async () => {
            try {
                // setLoading(true);
                // let token = authToken;
                // let level = userLevel;
                // if (!token) {
                //     const login = await axios.post(
                //         'https://dash.coursistant.com:8086/api/login',
                //         {
                //             email: '123',
                //             password: '123',
                //             role: 'USER'
                //         }
                //     );
                //     token = login.data?.data?.accessToken;
                //     level = login.data?.data?.level ?? 'USER';
                //     setAuthToken(token);
                //     setUserLevel(level);
                // }
                setLoading(true);
                console.log("user", user);
                setUserLevel(user.level ?? 'USER');
                setAuthToken(user.accessToken);
                const res = await axios.get(
                    `${VITE_ANNOUNCEMENT_API_DOMAIN_NAME}/announcement/selectAll`,
                    { headers: { 'token': user.accessToken, 'X-Timezone': getBrowserTimeZone() } }
                );
                setAnnouncements(res.data?.data ?? []);
            } catch (err) {
                console.error('announcement fetch failed →', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [selectedChatSection, announcements.length, authToken, userLevel]);

    //Helper to refresh after a Publish
    const refresh = async (token = authToken) => {
        if (!token) return;
        const res = await axios.get(
            'https://dash.coursistant.com:8086/api/announcement/selectAll',
            { headers: { token, 'X-Timezone': getBrowserTimeZone() } }
        );
        setAnnouncements(res.data?.data ?? []);
    };

    //close helper
    const closeEverything = () => {
        setShowAnnouncement(false);
        setShowCreate(false);
        setSelectedChatSection('ai'); // return user to AI chat
    };

    return (
        <>
            {showAnnouncement && (
                <AnnouncementModal
                    loading={loading}
                    announcements={announcements}
                    canCreate={userLevel === 'TEACHER'}
                    onClose={closeEverything}
                    onCreate={() => { setShowAnnouncement(false); setShowCreate(true); }}
                />
            )}

            {showCreate && (
                <CreateAnnouncementModal
                    onClose={closeEverything}
                    setIsHavingContent={() => { }}
                    token={authToken}
                    refresh={refresh}
                />
            )}
        </>
    );
}
