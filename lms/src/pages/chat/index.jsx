// Simplified chat implementation - iframe only
import { useState, useRef, useEffect } from 'react';
import AnnouncementManager from 'src/sections/chat/announcement-main-component';
import RocketChatIframe from '../../components/RocketChatIframe';

const Chat = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [selectedChatSection, setSelectedChatSection] = useState('rocketchat');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <>
        <div className="flex h-[calc(100vh-110px)] text-gray-700">
            <div className="flex-1 flex flex-col border border-[rgba(203,213,224,1)] rounded-xl overflow-y-auto">
                {/* RocketChat iframe */}
                <div className="w-full h-full flex flex-col">
                    <div className="flex-1">
                        <RocketChatIframe />
                    </div>
                </div>
            </div>
            <AnnouncementManager
                selectedChatSection={selectedChatSection}
                setSelectedChatSection={setSelectedChatSection}
            />
        </div>
        </>
    );
}

export default Chat;