import { useState, useRef, useEffect } from 'react';
import { CHAT_SECTION_MAP } from '../../constants/chatSectionMap';
import CreateGroupModal from './creategroupmodal';
import AutoAssignModal from './AutoAssignModal';
import { useAuth } from '../../contexts/AuthContext.js';
import axios from 'axios';
/* dummy data for the Members view */
const DIRECT_MESSAGES = ['Eleanor Pena', 'Cameron Williamson', 'Mia Watson'];
const INSTRUCTORS = ['Eleanor Pena', 'Cameron Williamson'];
const STUDENTS = [
  'Eleanor Pena', 'Cameron Williamson', 'Eleanor Pena',
  'Cameron Williamson', 'Eleanor Pena', 'Cameron Williamson',
];
const VITE_COURSE_API_DOMAIN = import.meta.env.VITE_COURSE_API_DOMAIN_NAME;

export default function SidebarList({
  chatType,
  setSelectedChatSection,
  setSelectedChatSectionParams,
}) {
  const { user } = useAuth();
  const [courseList, setCourseList] = useState([]);


    const fetchCourseList = async () => {
      const response = await axios.get(`${VITE_COURSE_API_DOMAIN}/course/selectByUserId/${user.id}`, {
        headers: {
            'token': `${user.accessToken}`
        }
    });
    if (response.data.code === "200" || response.data.code === 200) {
            const transformedCourses = response.data.data.map(course => ({
              id: course.id,
              title: course.name,
            }));
          setCourseList(transformedCourses);
    }
  }
//  useEffect(() => {
//    const fetchCourseList = async () => {
//      const response = await axios.get(`${VITE_COURSE_API_DOMAIN}/course/selectByUserId/${user.id}`, {
//        headers: {
//            'token': `${user.accessToken}`
//        }
//    });
//      if (response.data.code === "200" || response.data.code === 200) {
//        const transformedCourses = response.data.data.map(course => ({
//          id: course.id,
//          title: course.name,
//        }));
//       setCourseList(transformedCourses);


  const [rocketChatRooms, setRocketChatRooms] = useState([]);
  
  // Fetch Rocket.Chat rooms directly
  useEffect(() => {
    const fetchRocketChatRooms = async () => {
      try {
        console.log('🔄 Fetching Rocket.Chat rooms for sidebar...');
        
        if (!rocketChatAPI.isAuthenticated()) {
          console.log('❌ Not authenticated with Rocket.Chat');
          return;
        }
        
        const response = await rocketChatAPI.getRooms();
        const rooms = response.channels || [];
        console.log('📋 Sidebar rooms loaded:', rooms);
        setRocketChatRooms(rooms);
      } catch (error) {
        console.error('❌ Failed to fetch Rocket.Chat rooms for sidebar:', error);

      }
    };
    fetchCourseList();
  }, [user]);
  const mode = chatType.toLowerCase();
  console.log('[Sidebar] mode =', mode);

  return (
    <div className="w-72 p-0 space-y-[6px] text-sm text-[#1E293B]">


      {/* body of the sidebar */}
      <ListBody
        mode={mode}
        setSelectedChatSection={setSelectedChatSection}
        setSelectedChatSectionParams={setSelectedChatSectionParams}
        courseList={courseList}
      />
    </div>
  );
}

function ModeSelector({ mode, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="w-full flex items-center justify-between rounded-xl px-4 py-2 font-medium
                   bg-gradient-to-r from-sky-400 to-indigo-400 text-white"
        onClick={() => setOpen(!open)}
      >
        {mode === 'message' ? 'Message' : 'Members'}
        <img src="/icons/chat/sidebar-arrow-down.png" className="h-3 w-3 ml-2" alt="▼" />
      </button>

      {open && (
        <div className="absolute left-0 top-[110%] w-full bg-white rounded-xl shadow-lg border
                        border-[rgba(203,213,224,1)] z-50">
          {['message', 'members'].map((m, i) => (
            <div
              key={m}
              onClick={() => { onChange(m); setOpen(false); }}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100
                         ${i === 0 ? 'rounded-t-xl' : ''} ${i === 1 ? 'rounded-b-xl' : ''}`}
            >
              {m === 'message' ? 'Message' : 'Members'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function ListBody({
  mode,
  setSelectedChatSection,
  setSelectedChatSectionParams,
  courseList,
}) {
  const [selected, setSelected] = useState(null);
  useEffect(() => setSelected(null), [mode]);

  /* modals that belong to the list body */
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const handleOpenAutoAssign = () => { setIsCreateGroupModalOpen(false); setShowAutoAssign(true); };
  const handleCloseAutoAssign = () => { setShowAutoAssign(false); setIsCreateGroupModalOpen(true); };
  const handleAutoAssignComplete = () => setShowAutoAssign(false);

  return (
    <>
      {mode === 'message' ? (
        /* message view */
        <>
          {/* {['ai', 'announcement'].map((key) => (*/}
          {['ai'].map((key) => (
            <Item
              key={CHAT_SECTION_MAP[key].id}
              id={CHAT_SECTION_MAP[key].id}
              type={CHAT_SECTION_MAP[key].id}
              icon={CHAT_SECTION_MAP[key].icon}
              label={CHAT_SECTION_MAP[key].title}
              selected={selected}
              setSelected={setSelected}
              setSelectedChatSection={setSelectedChatSection}
              setSelectedChatSectionParams={setSelectedChatSectionParams}
            />
          ))}

          <hr className="border-t border-[rgba(203,213,224,1)] my-2" />

          {/* Course Group */}
          <Section title={CHAT_SECTION_MAP.courseGroup.title} addIcon>
            {/* {['[CS01]Computer Science...', '[CS02]Computer Science...', '[CS03]Computer Science...'] */}
            {courseList.map((course, i) => (
                <Item
                  key={`course-${i}`} id={`course-${i}`}
                  type={CHAT_SECTION_MAP.courseGroup.id}
                  icon={CHAT_SECTION_MAP.courseGroup.icon}
                  label={course.title}
                  selected={selected} setSelected={setSelected}
                  setSelectedChatSection={setSelectedChatSection}
                  setSelectedChatSectionParams={setSelectedChatSectionParams}
                  label_param={[course.id, course.title]}
                />
              ))}
          </Section>

          {/* Group Messages */}
          {/* <Section
            title={CHAT_SECTION_MAP.groupMessages.title}
            addIcon
            onCreateGroup={() => setIsCreateGroupModalOpen(true)}
          >
            {['Homework Group-A', 'Paper Group-B', 'Alpha'].map((label, i) => (
              <Item
                key={`group-${i}`} id={`group-${i}`}
                type={CHAT_SECTION_MAP.groupMessages.id}
                icon={CHAT_SECTION_MAP.groupMessages.icon}
                label={label}
                selected={selected} setSelected={setSelected}
                setSelectedChatSection={setSelectedChatSection}
                setSelectedChatSectionParams={setSelectedChatSectionParams}
                label_param={label}
              />
            ))}
          </Section> */}

          {/* Topic Classification */}
          {/* <Section title={CHAT_SECTION_MAP.topicClassification.title} addIcon>
            {['TCP mode measurement', 'TCP mode measurement', 'TCP mode measurement']
              .map((label, i) => (
                <Item
                  key={`topic-${i}`} id={`topic-${i}`}
                  type={CHAT_SECTION_MAP.topicClassification.id}
                  icon={CHAT_SECTION_MAP.topicClassification.icon}
                  label={label}
                  selected={selected} setSelected={setSelected}
                  setSelectedChatSection={setSelectedChatSection}
                  setSelectedChatSectionParams={setSelectedChatSectionParams}
                  label_param={label}
                />
              ))}
          </Section> */}

          {/* Post */}
          {/* <Section title={CHAT_SECTION_MAP.post.title}>
            <Item
              id="post-0"
              type={CHAT_SECTION_MAP.post.id}
              icon={CHAT_SECTION_MAP.post.icon}
              label="[CS01]Computer Science..."
              selected={selected} setSelected={setSelected}
              setSelectedChatSection={setSelectedChatSection}
              setSelectedChatSectionParams={setSelectedChatSectionParams}
              label_param="[CS01]Computer Science..."
            />
          </Section> */}
        </>
      ) : (
        /* members view */
        <>
          {/* {['ai', 'announcement', 'friends'].map((key) => ( */}
          {['ai', 'friends'].map((key) => (

            <Item
              key={CHAT_SECTION_MAP[key].id}
              id={CHAT_SECTION_MAP[key].id}
              type={CHAT_SECTION_MAP[key].id}
              icon={CHAT_SECTION_MAP[key].icon}
              label={CHAT_SECTION_MAP[key].title}
              selected={selected} setSelected={setSelected}
              setSelectedChatSection={setSelectedChatSection}
              setSelectedChatSectionParams={setSelectedChatSectionParams}
            />
          ))}

          {/* <CollapsibleSection title="Direct Messages">
            {DIRECT_MESSAGES.map((n, i) => (
              <Item key={`dm-${i}`} id={`dm-${i}`} type="dm"
                icon="/icons/chat/announcement/_Avatar item.png" label={n}
                isRoster
                selected={selected} setSelected={setSelected}
                setSelectedChatSection={setSelectedChatSection}
                setSelectedChatSectionParams={setSelectedChatSectionParams} />
            ))}
          </CollapsibleSection> */}
{/* 
          <CollapsibleSection title="Instructor">
            {INSTRUCTORS.map((n, i) => (
              <Item key={`inst-${i}`} id={`inst-${i}`} type="inst"
                icon="/icons/chat/announcement/_Avatar item.png" label={n}
                selected={selected} setSelected={setSelected}
                setSelectedChatSection={setSelectedChatSection}
                setSelectedChatSectionParams={setSelectedChatSectionParams} />
            ))}
          </CollapsibleSection> */}

          {/* <CollapsibleSection title="Student">
            {STUDENTS.map((n, i) => (
              <Item key={`stu-${i}`} id={`stu-${i}`} type="stu"
                icon="/icons/chat/announcement/_Avatar item.png" label={n}
                selected={selected} setSelected={setSelected}
                setSelectedChatSection={setSelectedChatSection}
                setSelectedChatSectionParams={setSelectedChatSectionParams} />
            ))}
          </CollapsibleSection> */}
        </>
      )}

      {/* Modals shared by both views */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onOpenAutoAssign={handleOpenAutoAssign}
      />
      <AutoAssignModal
        isOpen={showAutoAssign}
        onClose={handleCloseAutoAssign}
        onAssign={handleAutoAssignComplete}
      />
    </>
  );
}

/* Collapsible section for Members view */
function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div
        className="flex items-center justify-between text-xs font-medium text-gray-500 mb-1 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center">
          <span className="ml-3">{title}</span>
          <img
            src={`/icons/chat/${open ? 'sidebar-arrow-down.png' : 'sidebar-arrow-right.png'}`}
            className="ml-1"
            alt=""
          />
        </div>
      </div>
      {open && <div className="space-y-1">{children}</div>}
    </div>
  );
}

// Section Title Component
function Section({ title, children, addIcon = false, onCreateGroup }) {
  // Define menu items per section title
  const dropdownRef = useRef(null);
  const menuItems =
    title === 'Course Group'
      ? [
        { label: 'Create Course' },
        { label: 'Invite to' },
        { label: 'Copy Link' },
        { label: 'Disband group' },
      ]
      : title === 'Group Messages'
        ? [
          { label: 'Create Group', onClick: onCreateGroup },
          { label: 'Invite to' },
          { label: 'Copy Link' },
        ]
        : [];

  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-1">
        <div className="flex items-center">
          <span className="ml-3">{title}</span>
          <img src="/icons/chat/sidebar-arrow-down.png" className="ml-1" alt="Arrow Down" />
        </div>
        {addIcon && (
          <div className="relative">
            <button
              className="text-gray-400 mr-4 cursor-pointer hover:text-black text-sm"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              +
            </button>
            {menuOpen && menuItems.length > 0 && <DropdownMenu items={menuItems} className="left-[28px] top-[-8px]" dropdownRef={dropdownRef} setMenuOpen={setMenuOpen} />}
          </div>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DropdownMenu({ items = [], dropdownRef, setMenuOpen }) {
  return (
    <div className={`absolute mt-2 w-40 bg-white rounded-xl shadow-lg border border-[rgba(203,213,224,1)] z-50`} ref={dropdownRef}>
      {items.map(({ label, onClick }, idx) => (
        <div
          key={idx}
          onClick={() => {
            if (onClick) onClick();
            setMenuOpen(false);
          }}
          className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100
            ${idx === 0 ? 'rounded-t-xl' : ''}
            ${idx === items.length - 1 ? 'rounded-b-xl' : ''}`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

// List Item Component with click highlighting
function Item({ id, type, icon, label, selected, setSelected, setSelectedChatSection, setSelectedChatSectionParams, label_param = null, isRoster = false }) {
  const isSelected = selected === id;
  return (
    <div
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-[rgba(226,232,240,1)]' : 'hover:bg-[rgba(226,232,240,1)]'
        }`}
      onClick={() => {
        setSelected(id);

        if (isRoster) {
          setSelectedChatSection('directMessage');
          setSelectedChatSectionParams({
            name: label,
            mutual: 'placeholder', // placeholder
          });
          return;
        }
        setSelectedChatSection(type);
        setSelectedChatSectionParams({ label: label_param });
      }}>
      <img src={icon} className="w-4 h-4" alt="" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function Item2({ id, type, icon, label, selected, setSelected, setSelectedChatSection, setSelectedChatSectionParams, label_param = null }) {
  const isSelected = selected === id;
  return (
    <div
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-[rgba(226,232,240,1)]' : 'hover:bg-[rgba(226,232,240,1)]'
        }`}
      onClick={() => {
        console.log("pop up")
        setSelected(id);
        setSelectedChatSection(type);
        setSelectedChatSectionParams({ label: label_param });
      }}
    >
      <img src={icon} className="w-4 h-4" alt="" />
      <span className="truncate">{label}</span>
    </div>
  );



  /* helpers just for members mode */
  function CollapsibleGroup({ title, children }) {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button
          className="w-full flex items-center justify-between text-xs font-medium text-gray-500 mb-1"
          onClick={() => setOpen(!open)}
        >
          <span>{title}</span>
          <img
            src="/icons/chat/sidebar-arrow-down.png"
            className={`w-3 h-3 transition-transform ${open ? '' : 'rotate-180'}`}
          />
        </button>
        {open && <div className="space-y-1 ml-1">{children}</div>}
      </>
    );
  }

  function PersonRow({ name, unread = 0 }) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 hover:bg-[#E2E8F0] rounded-lg cursor-pointer">
        <img src="/icons/chat/friends/_Avatar base.png" className="w-6 h-6 rounded-full" />
        <span className="truncate">{name}</span>
        {unread ? (
          <span className="ml-auto text-white rounded-full text-[10px] px-[6px]">
            {unread}
          </span>
        ) : null}
      </div>
    );
  }
}


// Create Channel Modal Component
function CreateChannelModal({ isOpen, onClose }) {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) {
      setError('Channel name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Creating channel:', channelName);
      const response = await rocketChatAPI.createChannel(
        channelName.trim(),
        description.trim(),
        false, // readOnly
        [] // members
      );

      if (response.success) {
        console.log('Channel created successfully:', response.channel);
        setChannelName('');
        setDescription('');
        onClose();
        // Refresh the page to show new channel
        window.location.reload();
      } else {
        setError('Failed to create channel');
      }
    } catch (err) {
      console.error('Channel creation error:', err);
      setError(err.message || 'Failed to create channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setChannelName('');
    setDescription('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}}>
      <div className="bg-white bg-opacity-90 backdrop-blur-lg rounded-lg p-6 w-96 max-w-md mx-4 shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create New Channel</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel Name *
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter channel name"
              disabled={isLoading}
            />
          </div>

          {/* <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic 
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter channel description"
              rows="3"
              disabled={isLoading}
            />
          </div> */}

          {error && (
            <div className="mb-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || !channelName.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
