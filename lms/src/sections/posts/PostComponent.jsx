//Changed to Announcement per request
import React from "react";

import { useNavigate } from "react-router-dom";

import "./PostComponent.scss";

const PostComponent = ({ posts }) => {
  const navigate = useNavigate();
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '…';
  }
  return (
    <div className="posts-container">
        <div className="posts-header">
            <h1 className="font-semibold text-[1.2rem] text-primary-color ml-1">Posts</h1>
            <div className="posts-header-see-all">
                <p>See all</p>
                <img src="icons/assignments/arrow-right.png" alt="Resources" />
            </div>
        </div>
        <div className="horizontal-line" />
        <div className="posts-list">
        {posts.map((post, idx) => (
            <div className="post-item" key={idx}>
            <div className="post-item-content">
                <div className="post-item-content-header">
                    <h2 className="text-primary-color font-semibold">{post.title}</h2>
                    <span className="brand-color ml-2 px-3 py-0.5 rounded-md font-medium text-[0.8rem]">
                        {post.category}
                    </span>
                    <div className="spacer" />
                    <p>{post.time}</p>
                </div>
                <div className="post-item-content-body">
                <p>
                    {truncateText(post.body, 95)}
                    <a className="text-brand-primary ml-1 whitespace-nowrap cursor-pointer" onClick={() => navigate(`/post/${post.postId}`)}> Learn more</a>
                </p>
                </div>
            </div>
            </div>
        ))}
        </div>
    </div>
  );
};

export default PostComponent;
