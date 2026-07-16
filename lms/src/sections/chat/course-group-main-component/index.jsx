import CourseGroupHeader from './header';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useState, useEffect } from 'react';
import RoosterRightColumn from './rooster-right-column';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext.js';

const CourseGroupComponent = ( {selectedChatSectionParams} ) => {
    const { courseId, title } = { courseId: selectedChatSectionParams.label[0], title: selectedChatSectionParams.label[1] };
    const { user } = useAuth();
    const VITE_COURSE_API_DOMAIN = import.meta.env.VITE_COURSE_API_DOMAIN_NAME;
    const [messages, setMessages] = useState([
        // {
        //   id: 1,
        //   sender: 'Sylvia Reyes',
        //   time: '07:40 AM',
        //   content: "Hi, everyone! 👋\nI'd like to start this thread to discuss social media marketing.",
        //   avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        //   reactions: [
        //     { emoji: '👍', count: 2 },
        //     { emoji: '❤️', count: 1 }
        //   ],
        //   file: null
        // },
        // {
        //     id: 2,
        //     sender: 'Alfonso Vacaaro',
        //     time: '10:00 AM',
        //     content: 'joined along with Brandon Francisco',
        //     avatarUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
        //     file: null,
        //     reactions: []
        // },
        // {
        //     id: 4,
        //     sender: 'Kaiya Lubin',
        //     time: '12:00 PM',
        //     content: 'Please check this file',
        //     avatarUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
        //     file: { name: 'ReactJS-for-beginner.pdf', size: '4.5 MB' },
        //     reactions: []
        // },
        // {
        //     id: 5,
        //     sender: 'Kaith Lubin',
        //     time: '12:10 PM',
        //     content: 'Hi, everyone!',
        //     avatarUrl: 'https://randomuser.me/api/portraits/women/42.jpg',
        //     reactions: []
        // }
    ]);
    // const users = [
    //     {
    //       level: "Student",
    //       name: "Kristin Watson",
    //       profile: "https://randomuser.me/api/portraits/women/44.jpg",
    //       email: "kristin.watson@college.edu",
    //       major: "Business Administration"
    //     },
    // ];
    const [users, setUsers] = useState([]);
    useEffect(() => {
        const fetchUsers = async () => {
            const response = await axios.get(`${VITE_COURSE_API_DOMAIN}/learn/selectByCourseId/${courseId}`, {
                headers: {
                    'token': `${user.accessToken}`
                }
            });
            if (response.data.code === "200" || response.data.code === 200) {
              const transformedUsers = response.data.data.map(user => ({
                level: user.level,
                name: user.name,
                profile: user.avatar ?? "icons/default_avatar.jpg",
                email: user.email,
                major: user.major ?? ""
              }));
              setUsers(transformedUsers);
            }
        }
        fetchUsers();
    }, [user, courseId]);

    const [rosterOpen, setRosterOpen] = useState(false);
    const handleSend = (newMessage) => {
        setMessages([...messages, newMessage]);
    };

    return (
        <>
            {/* Header */}
            <div className="border-b border-[rgba(203,213,224,1)] px-6 py-[11.5px] h-[57px]">
                <CourseGroupHeader params={{title, courseId}} setRosterOpen={setRosterOpen}/>
            </div>
            {/* Main Content */}
            {/* <iframe src="http://coursistant.com:4000" width="100%" height="800px"></iframe> */}
            {/* <iframe src="http://localhost:5173" width="100%" height="800px"></iframe> */}
            
            <div className="h-full flex overflow-y-auto">
                {/* <div className="flex-1 flex flex-col border-r border-gray-300 overflow-y-auto"> */}
                <div className="flex-1 flex flex-col border-r border-gray-300 overflow-y-auto">
                {/* Left Column: Chat */}
                    <div className="p-4">
                        <MessageList messages={messages} />
                    </div>
                    <div className="flex-1"/>
                    <div className="p-4">
                        <MessageInput onSend={handleSend} />
                    </div>
                </div>
                {/* Right Column: Dynamic roster */}
                {/* {rosterOpen && (<RoosterRightColumn users={users}/>)} */}
                <div className={`w-[400px] p-4 ${rosterOpen ? 'block' : 'hidden'} overflow-y-auto`}>
                    <RoosterRightColumn users={users}/>
                </div>
            </div>
        </>
    )
}
export default CourseGroupComponent;