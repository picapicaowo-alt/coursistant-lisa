import React, { useState, useRef, useEffect } from 'react';
import { CornerUpLeft, CornerUpRight, MoreVertical } from "lucide-react";

const MessageItem = ({ message, currentMoreOpenedId, setCurrentMoreOpenedId }) => {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);
  const moreActionsRef = useRef(null);
  const isMoreOpen = currentMoreOpenedId === message.id;

  const handleShowActions = (enter) => {
    if (enter && currentMoreOpenedId === null) {
      setShowActions(true);
    } else if (!enter && currentMoreOpenedId === null) {
      setShowActions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isMoreOpen &&
        actionsRef.current &&
        moreActionsRef.current &&
        !actionsRef.current.contains(e.target) &&
        !moreActionsRef.current.contains(e.target)
      ) {
        setCurrentMoreOpenedId(null);
        setShowActions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreOpen, setCurrentMoreOpenedId]);

  return (
    <div
      className={`relative p-3 rounded transition flex items-start gap-3 ${
        currentMoreOpenedId === null ? 'hover:bg-[rgba(226,232,240,1)]' : ''
      }`}
      onMouseEnter={() => { handleShowActions(true); }}
      onMouseLeave={() => { handleShowActions(false); }}
    >
      <img src={message.avatarUrl || '/icons/default_avatar.jpg'} alt="avatar" className="w-10 h-10 rounded-full object-cover" />

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">{message.sender}</span>
          <span className="text-sm text-gray-400">{message.time}</span>
        </div>

        <div className="mt-1 whitespace-pre-wrap">{message.content}</div>

        {message.file && (
          <div className="mt-2 flex items-center gap-2 p-2 border border-gray-300 rounded bg-gray-50">
            <div className="text-red-500 font-bold">.PDF</div>
            <div>{message.file.name} ({message.file.size})</div>
          </div>
        )}

        {message.reactions && (
          <div className="flex items-center gap-2 mt-2">
            {message.reactions.map((reaction, index) => (
              <div key={index} className="flex items-center bg-white border border-gray-300 rounded px-2 py-1 text-sm">
                {reaction.emoji} <span className="ml-1">{reaction.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showActions && (
        <div className="absolute top-[-5px] right-2" ref={actionsRef}>
          <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-sm px-2 py-0 space-x-3">
            <div className="flex items-center space-x-1">
              <button className="hover:bg-gray-100 p-1 rounded-full cursor-pointer">👍</button>
              <button className="hover:bg-gray-100 p-1 rounded-full cursor-pointer">👎</button>
              <button className="hover:bg-gray-100 p-1 rounded-full cursor-pointer">❤️</button>
            </div>
            <div className="w-px h-5 bg-gray-300"></div>
            <div className="flex items-center space-x-1">
              <button className="hover:bg-gray-100 p-1 rounded-full cursor-pointer"><CornerUpLeft size={20} /></button>
              <button className="hover:bg-gray-100 p-1 rounded-full cursor-pointer"><CornerUpRight size={20} /></button>
              <button
                className="hover:bg-gray-100 p-1 rounded-full cursor-pointer"
                onClick={() => {
                  if (isMoreOpen) {
                    setCurrentMoreOpenedId(null);
                  } else {
                    setCurrentMoreOpenedId(message.id);
                  }
                }}
              >
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isMoreOpen && (
        <div className="absolute top-8 right-2 z-10" ref={moreActionsRef}>
          <div className="bg-white border shadow rounded w-40">
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">Reply</button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">Forward</button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">Create Thread</button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">Copy Text</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
