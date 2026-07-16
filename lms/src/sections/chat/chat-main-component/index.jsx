import ChatHeader from './header';
import ChatContent from '../../../components/ChatContent.tsx';
import ChatHistory from './chat-history';
import { useRef, useState } from 'react';
const ChatMainComponent = () => {
    const chatContentRef = useRef();
    const handleAddNewClick = () => {
        if (chatContentRef.current) {
          chatContentRef.current.handleNewChat();
        }
    };
    const [showHistory, setShowHistory] = useState(false);
    return (
        <>
            {/* Header */}
            <div className="border-b border-[rgba(203,213,224,1)] px-6 py-[11.5px] h-[57px]">
                <ChatHeader params={ { label: "Chat" } } onAddNew={handleAddNewClick} setShowHistory={setShowHistory}/>
            </div>
            {/* Floating ChatHistory */}
            {/* {showHistory && (
                <div className="fixed top-[57px] left-10 w-64 h-full bg-white shadow-lg z-50 transform transition-transform duration-300">
                <ChatHistory />
                </div>
            )} */}
            <ChatContent ref={chatContentRef} showHistory={showHistory} setShowHistory={setShowHistory} />
        </>
    )
}

export default ChatMainComponent;