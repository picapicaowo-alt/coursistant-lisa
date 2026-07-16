import styles from "./ChatComponent.module.scss";
import ChatContent from '@/components/ChatContent.js';

const ChatComponent = () => {
  return (
    <div className={styles.chatContainer}>
      <ChatContent isIntroTop={true} isDashboard={true}/>
    </div>
  );
};

export default ChatComponent;
