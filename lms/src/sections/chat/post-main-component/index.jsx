import Post from "./post";
import PostDetail from "./post-detail";
import PostDetailHeader from "./post-detail/header";
import PostHeader from "./post/header";
import { useState } from "react";
const PostMainComponent = ({ selectedChatSectionParams }) => {
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [selectedPostTitle, setSelectedPostTitle] = useState(null);
    const handleSelectPost = ( postId, postTitle ) => {
        setSelectedPostId(postId);
        setSelectedPostTitle(postTitle);
    };
    const handleBack = () => {
        setSelectedPostId(null);
        setSelectedPostTitle(null);
    };
    return selectedPostId ? (
        <>
            {/* Header */}
            <div className="border-b border-[rgba(203,213,224,1)] px-6 py-[11.5px] h-[57px]">
                <PostDetailHeader params={ { title: selectedPostTitle } } onBack={handleBack} />
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
                <PostDetail postId={selectedPostId} />
            </div>
        </>
      ) : (
        <>
            {/* Header */}
            <div className="border-b border-[rgba(203,213,224,1)] px-6 py-[11.5px] h-[57px]">
                <PostHeader params={selectedChatSectionParams}/>
            </div>
        
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
                <Post onSelectPost={handleSelectPost} />
            </div>
        </>
      );
}   

export default PostMainComponent;