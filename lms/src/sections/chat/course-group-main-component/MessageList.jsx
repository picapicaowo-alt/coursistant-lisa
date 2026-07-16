import MessageItem from './MessageItem';
import { useState } from 'react';
const MessageList = ({ messages }) => {
    const [currentMoreOpenedId, setCurrentMoreOpenedId] = useState(null);
    return (
        <div className="space-y-4">
            {messages.map((msg) => (
             <MessageItem
             key={msg.id}
             message={msg}
             currentMoreOpenedId={currentMoreOpenedId}
             setCurrentMoreOpenedId={setCurrentMoreOpenedId}
           />
            ))}
      </div>
    );
};

export default MessageList;