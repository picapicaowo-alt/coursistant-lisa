import { useState } from 'react';

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    const newMessage = {
      sender: 'You',
      time: 'Now',
      content: text,
      avatarUrl: '/icons/default_avatar.jpg',
      reactions: [
        { emoji: '👍', count: 2 },
        { emoji: '❤️', count: 1 }
      ],
      file: null
    };
    onSend(newMessage);
    setText('');
  };

  return (
    <div className="flex flex-col border border-gray-300 min-h-[100px] rounded-xl px-4 py-2">
  
        {/* Input on top */}
        <textarea
            placeholder="Group chat is being developed..."
            className="flex-1 bg-transparent mt-2 focus:outline-none text-gray-700 placeholder-gray-400 mb-3 resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
                }
            }}
            disabled={true}
        />
  
        {/* Icons + Send button below */}
        <div className="flex items-center justify-between">
            <div className="flex-1"/>
            <div className="flex items-center gap-3 mr-3 text-gray-500">
                <img src="/icons/chat/course-group/group-chat-input-1.png" alt="Image" className="cursor-pointer" />
                <img src="/icons/chat/course-group/group-chat-input-2.png" alt="Paperclip" className="cursor-pointer" />
                <img src="/icons/chat/course-group/group-chat-input-3.png" alt="At Sign" className="cursor-pointer" />
                <img src="/icons/chat/course-group/group-chat-input-4.png" alt="Smile" className="cursor-pointer" />
            </div>

            <button 
            onClick={handleSend} 
            className="text-white text-sm bg-[rgba(203,213,224,1)] rounded-lg px-3 py-1 cursor-pointer hover:bg-[rgba(203,213,224,0.8)]"
            >
                Send
            </button>
        </div>
    </div>
  );
}

export default MessageInput;