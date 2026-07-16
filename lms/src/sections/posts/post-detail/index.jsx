import { useParams, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import styles from "./styles.module.scss";
import Comment from "./comment";
import ChatComponent from "../../dashboard/new-content/create-content/chatbot/index";
const PostDetail = () => {
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const { postId } = useParams();
    const navigate = useNavigate();
    const commentData = {
        author: "Sylvia Reyes",
        role: "Instructor",
        avatar: "/icons/posts/instructor.png",
        timestamp: "12:14PM",
        content:
          "Do mathematicians use these methods in advanced mathematics, or are these only used at the elementary level?",
        likes: 560,
        dislikes: 0,
        replies: [
          {
            author: "Sylvia Reyes",
            role: "Instructor",
            avatar: "/icons/posts/instructor.png",
            timestamp: "8mo",
            content:
              "From my experience, I stopped using these around the 2nd grade and yes, they are mostly used at the elementary level.",
            likes: 560,
            dislikes: 0,
            replies: [
                {
                    author: "Sylvia Reyes",
                    role: "Instructor",
                    avatar: "/icons/posts/instructor.png",
                    timestamp: "8mo",
                    content:
                        "From my experience, I stopped using these around the 2nd grade and yes, they are mostly used at the elementary level.",
                    likes: 560,
                    dislikes: 0,
                },

                {
                    author: "Sylvia Reyes",
                    role: "Instructor",
                    avatar: "/icons/posts/instructor.png",
                    timestamp: "8mo",
                    content:
                        "From my experience, I stopped using these around the 2nd grade and yes, they are mostly used at the elementary level.",
                    likes: 560,
                    dislikes: 0,
                }
            ]
          },
        ],
    };
    return (
        <div className="w-full">
            <div className="w-[95%] mx-auto p-6 space-y-6">
                {/* Main Post */}
                <span className="text-2xl font-semibold text-[rgba(45,55,72,1)]">
                    What is Programming?
                </span>
                <div className="space-y-2 mt-6">
                    {/* Post Header */}
                    <div className="flex items-center gap-3">
                        <img
                            src="/icons/posts/instructor.png"
                            alt="Sylvia Reyes"
                            className="w-10 h-10 rounded-full border border-[rgba(203,213,224,1)]"
                        />
                        <div className="flex items-start flex-col">
                            <span className="font-medium text-[rgba(45,55,72,1)]">Sylvia Reyes</span>
                            <span className="text-sm text-[rgba(107,114,128,1)]">Instructor</span>
                        </div>
                        <span className="text-sm text-[rgba(127,156,245,1)] bg-[rgba(195,218,254,1)] px-2 py-0.5 rounded">
                            Question
                        </span>
                        <div className="flex-1"/>
                        <span className="text-sm text-[rgba(107,114,128,1)]">12:14PM</span>
                    </div>
                    {/* Post Content */}
                    <div>
                        <p className="text-[rgba(45,55,72,1)] font-medium text-md mt-3">
                            In this course, we'll be teaching the concepts of the JavaScript programming language and the cool functions you can use with it in the ProcessingJS library. Before you dig in, here's a brief tour of how we teach programming here on Khan Academy, and how we think you can learn the most.
                            Normally, we teach on Khan Academy using videos, but here in programming land, we teach with something we call "talk-throughs". A talk-through is like a video, but it's actually interactive- you can pause at any time if you want to play with the code yourself, and you can spin-off if you want to make your own version of what we made.  Here's an animated GIF of a talk-through (there will be sound in the actual talk-throughs!):
                        </p>
                        {/* Post Footer */}
                        <div className="flex items-center gap-2">
                            <a href="#" className="flex items-center gap-1 text-md text-[rgba(86,111,232,1)] mt-2 block">
                                <img src="/icons/posts/attachment.png" alt="attachment" />
                                <span>1 attachment download</span>
                            </a>
                            <div className="flex-1"/>
                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-2 cursor-pointer">
                                    <img src="/icons/posts/like.png" alt="like" />
                                    <span>560</span>
                                </div>
                                <div className="flex items-center gap-2 cursor-pointer">
                                    <img src="/icons/posts/dislike.png" alt="dislike" />
                                    <span>0</span>
                                </div>
                                <button className="bg-[rgba(226,232,240,1)] px-4 py-1 rounded-lg cursor-pointer hover:bg-[rgba(226,232,240,0.7)] hover:text-[rgba(45,55,72,1)] transition-colors duration-300">Reply</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Answer Thread */}
                <div>
                    <span className="text-lg font-medium border-b-3 border-[rgba(86,111,232,1)] pb-1">12 Answers</span>
                    <div className="border-dashed border-t border-[rgba(203,213,224,1)] mt-[-0.03rem] mb-4"/>
                    {/* Comment */}
                    <Comment {...commentData} />
                </div>
            </div>
            {/* Chatbot */}
            {!isChatbotOpen && (
                    <div className="fixed bottom-6 right-6 z-50">
                        <img src="/icons/add-content/chatbot.png" alt="Floating Icon" 
                            className="rounded-full cursor-pointer hover:scale-110 transition-all duration-300"
                         onClick={() => {
                            setIsChatbotOpen(true);
                        }}/>
                    </div>
            )}
            {isChatbotOpen && <ChatComponent setIsChatbotOpen={setIsChatbotOpen}/>}
        </div>
    );
};

export default PostDetail;