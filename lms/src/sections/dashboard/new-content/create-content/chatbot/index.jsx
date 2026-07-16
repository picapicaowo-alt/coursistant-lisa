import React from "react";
import styles from "./styles.module.scss"; // Import the SCSS file
import ChatContent from '@/components/ChatContent.tsx';


const ChatComponent = ({setIsChatbotOpen}) => {
  return (
    <div className={styles.chatContainer}>
      <ChatContent isSummary={true} isPopup={true} setIsChatbotOpen={setIsChatbotOpen}/>
    </div>
  );
};

export default ChatComponent;
