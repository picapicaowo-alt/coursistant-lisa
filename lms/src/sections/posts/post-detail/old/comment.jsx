import React from "react";
import MarkdownMessage from "src/components/MarkdownMessage";

const Comment = ({
  author,
  role,
  avatar,
  timestamp,
  content,
  likes,
  dislikes,
  replies = [],
}) => {
  return (
    <div className="space-y-3 relative">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={author}
          className="w-10 h-10 rounded-full border border-[rgba(203,213,224,1)]"
        />
        <div className="flex flex-col">
          <span className="font-medium text-[rgba(45,55,72,1)]">{author}</span>
          <span className="text-sm text-[rgba(107,114,128,1)]">{role}</span>
        </div>
        <div className="flex-1" />
        <span className="text-sm text-[rgba(107,114,128,1)]">{timestamp}</span>
      </div>

      {/* Body */}
      <div className="pl-13">
        <MarkdownMessage className="text-[rgba(45,55,72,1)] mt-1" content={content} />
        <div className="flex items-center gap-2">
          {replies.length > 0 && (
            <span className="text-md text-[rgba(86,111,232,1)] mt-2 block">
              {replies.length} comment{replies.length > 1 ? "s" : ""}
            </span>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/icons/posts/like.png" alt="like" />
              <span>{likes}</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
              <img src="/icons/posts/dislike.png" alt="dislike" />
              <span>{dislikes}</span>
            </div>
            <button className="bg-[rgba(226,232,240,1)] px-4 py-1 rounded-lg cursor-pointer hover:bg-[rgba(226,232,240,0.7)] hover:text-[rgba(45,55,72,1)] transition-colors duration-300">
              Reply
            </button>
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-6 ml-12 border-l border-gray-200 pl-6 space-y-6">
            {replies.map((reply, idx) => (
              <Comment key={idx} {...reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
