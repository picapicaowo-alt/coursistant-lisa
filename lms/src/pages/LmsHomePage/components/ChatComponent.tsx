import styles from "./ChatComponent.module.scss";
import ChatContent from '@/components/ChatContent';
import type {DashboardAssistantRequest} from './DueNextCard';

interface ChatComponentProps {
  dashboardRequest?: DashboardAssistantRequest | null;
}

const ChatComponent = ({dashboardRequest}: ChatComponentProps) => {
  return (
    <div className={styles.chatContainer}>
      <ChatContent isIntroTop={true} isDashboard={true} dashboardRequest={dashboardRequest}/>
    </div>
  );
};

export default ChatComponent;
