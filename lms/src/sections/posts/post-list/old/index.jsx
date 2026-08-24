import React from "react";

import { useNavigate } from "react-router-dom";

import styles from "./styles.module.scss";
import MarkdownMessage from "src/components/MarkdownMessage";

const PostComponent = ({ posts }) => {
  const navigate = useNavigate();
  return (
    <div className={styles.postListContainer}>
        <div className={styles.postList}>
        {posts.map((post, idx) => (
            <div className={styles.postItem} key={idx}>
            <div className={styles.postItemContent}>
                <div className={styles.postItemContentHeader}>
                <h2>{post.title}</h2>
                <div className={styles.spacer} />
                <p>{post.time}</p>
                </div>
                <div className={styles.postItemActionsInstructor}>
                <img
                    className={styles.courseHeaderInstructorImage}
                    src={post.instructor.image}
                    alt="course-icon"
                />
                <div className={styles.courseHeaderInstructor}>
                    <h1>{post.instructor.name}</h1>
                    <p>{post.instructor.role}</p>
                </div>
                <div className={styles.postItemActionsPostType}>
                    <p>{post.postType}</p>
                </div>
                </div>
                <div className={styles.postItemContentBody}>
                <MarkdownMessage content={post.body} />
                </div>
            </div>
            <div className={styles.postItemFooter}>
                <div className={styles.postItemActionsActions}>
                    <div className={styles.postItemActionsActionsItem}>
                        <img src="icons/posts/heart.png" alt="like" />
                        <p>{post.stats.likes}</p>
                    </div>
                    <div className={styles.postItemActionsActionsItem}>
                        <img src="icons/posts/message.png" alt="comment" />
                        <p className={styles.message}>{post.stats.comments}</p>
                    </div>
                    <div className={styles.postItemActionsActionsItem}>
                        <img src="icons/posts/share.png" alt="share" />
                        <p>{post.stats.shares}</p>
                    </div>
                </div>
                <div className={styles.spacer} />
                <a onClick={() => navigate(`/post/${post.postId}`)}> Learn more</a>
            </div>
            </div>
        ))}
        </div>
    </div>
  );
};

export default PostComponent;
