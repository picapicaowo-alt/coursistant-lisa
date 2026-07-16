import ChatMainComponent from '../sections/chat/chat-main-component/index';
import PostMainComponent from '../sections/chat/post-main-component/index';
import FriendsMainComponent from '../sections/chat/friends-main-component/index';
import CourseGroupComponent from '../sections/chat/course-group-main-component/index';
import DirectMessageContent from 'src/sections/chat/direct-message/index';

const Empty = () => null;

export const CHAT_SECTION_MAP = {
  ai: {
    id: 'ai',
    title: 'AI Course',
    icon: '/icons/chat/ai-icon.png',
    content: ChatMainComponent,
  },
  announcement: {
    id: 'announcement',
    title: 'Announcement',
    icon: '/icons/chat/announcement-icon.png',
    content: Empty,
  },

  friends: {
    id: 'friends',
    title: 'Friends',
    icon: '/icons/chat/friends/user-add.png',
    content: FriendsMainComponent
  },

  courseGroup: {
    id: 'courseGroup',
    title: 'Course Group',
    icon: '/icons/chat/group-icon.png',
    content: CourseGroupComponent,
  },

  groupMessages: {
    id: 'groupMessages',
    title: 'Group Messages',
    icon: '/icons/chat/message-icon.svg',
    // header: <GroupMessagesHeader />,
    // content: <GroupMessagesBody />,
  },

  topicClassification: {
    id: 'topicClassification',
    title: 'Topic Classification',
    icon: '/icons/chat/hashtag-icon.png',
    // header: <TopicClassificationHeader />,
    // content: <TopicClassificationBody />,
  },

  post: {
    id: 'post',
    title: 'Post',
    icon: '/icons/chat/post-icon.png',
    content: PostMainComponent,
  },

  directMessage: {
    id: 'directMessage',
    title: 'Direct Message',
    icon: '/icons/chat/friends/_Avatar base.png',
    content: DirectMessageContent,
  },
  rocketchat: {
    id: 'rocketchat',
    title: 'Rocket.Chat',
    icon: '/icons/chat/message-icon.svg',
    content: null, // Will be handled by RocketChatPane component
  },
  // Add more sections as needed
};
