// @ts-nocheck — legacy chat bundle; quarantined until chat migration (PROJECT_STANDARDS.md §13).
import styles from '../sections/chat/chat-main-component/styles.module.scss';
import {useState, useRef, useEffect, forwardRef, useImperativeHandle} from 'react';
import TypingText from "../utils/typing-text";
import {renderMessageText} from '@/utils/render-message-text';
import {useAuth} from '@/contexts/AuthContext.js';
import axios from 'axios';
import transformDate from '../utils/transformDate';
import {useNavigate} from 'react-router-dom';
import {useAiExamLockdown} from '@/hooks/useAiExamLockdown';
import {loadActiveChatCourses} from '@/utils/chatCourses';

const getSavedDialogueId = () => {
  const raw = localStorage.getItem('dialogueId');
  return /^\d+$/.test(raw ?? '') ? Number(raw) : -1;
};

interface Props {
  isIntroTop: boolean,
  isSummary?: false,
  isDashboard: boolean,
  isPopup?: false,
  setIsChatbotOpen?: (a: boolean) => void,
  showHistory?: false,
  setShowHistory?: (a: boolean) => void,
}

const ChatContent = forwardRef<HTMLDivElement, Props>(
  (
    props,
    ref
  ) => {
    const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
    const handoffRef = useRef(false);
    if (!handoffRef.current) {
      handoffRef.current = !!sessionStorage.getItem('pendingChat');
    }
    const VITE_CHAT_API_DOMAIN = import.meta.env.VITE_CHAT_API_DOMAIN_NAME;
    const STATIC_BASE = (import.meta.env.VITE_STATIC_BASE_URL || '').replace(/\/+$/, '');
    const navigate = useNavigate();
    const {user} = useAuth();
    const chatAuthHeaders = () => ({
      Authorization: `Bearer ${user.accessToken}`,
      // Kept during the legacy Study Support migration; old dialogue/query
      // handlers still inspect this alias while the v2 security filter uses
      // the standard Bearer header.
      token: user.accessToken,
      'X-Timezone': getBrowserTimeZone(),
    });
    const toFullURL = (u) => {
      if (!u) return null;
      if (!STATIC_BASE) return u;
      const path = u.startsWith('/') ? u : `/${u}`;
      return `${STATIC_BASE}${path}`;
    };
    const [courses, setCourses] = useState([]);
    const [isCourseOpen, setIsCourseOpen] = useState(false);
    const courseBoxRef = useRef(null);
    const handleSelectCourse = (id) => {
      setSelectedCourseId(Number(id));
      localStorage.setItem('selectedCourseId', String(id));
      setIsCourseOpen(false);
    };
    
    useEffect(() => {
      function onDown(e) {
        if (!courseBoxRef.current) return;
        if (!courseBoxRef.current.contains(e.target)) setIsCourseOpen(false);
      }
      
      document.addEventListener('mousedown', onDown);
      return () => document.removeEventListener('mousedown', onDown);
    }, []);
    const [isCoursesFetched, setIsCoursesFetched] = useState(false);
    const [courseFetchFailed, setCourseFetchFailed] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(() => {
      const v = localStorage.getItem('selectedCourseId');
      return v ? Number(v) : 0;
    });
    const fetchCourses = async () => {
      if (isCoursesFetched) return;
      setCourseFetchFailed(false);
      try {
        const list = await loadActiveChatCourses();
        setCourses(list);
        setIsCoursesFetched(true);
        
        const has = list.some(c => Number(c.id) === Number(selectedCourseId));
        if (!has && list.length) {
          setSelectedCourseId(Number(list[0].id));
          localStorage.setItem('selectedCourseId', String(list[0].id));
        }
      } catch (e) {
        console.error('Failed to fetch courses:', e);
        setCourseFetchFailed(true);
      }
    };
    
    
    useEffect(() => {
      if (user?.accessToken && user?.id) {
        fetchCourses();
      }
    }, [user?.accessToken, user?.id]);
    const currentCourseName =
      (selectedCourseId === 0 ? 'All Courses' : (courses.find(c => Number(c.id) === Number(selectedCourseId))?.name)) || 'All Courses';
    const relevantCourseIds = selectedCourseId === 0
      ? courses.map(course => Number(course.id))
      : [selectedCourseId];
    const examLockdown = useAiExamLockdown(
      relevantCourseIds,
      user?.id ?? null,
      Boolean(isCoursesFetched && user?.accessToken && user?.id),
    );
    const isExamStatusPending = (!isCoursesFetched && !courseFetchFailed) || examLockdown.status === 'checking';
    const isStudySupportUnavailable = isExamStatusPending
      || courseFetchFailed
      || examLockdown.status === 'locked'
      || examLockdown.status === 'error';
    const lockedCourseNames = courses
      .filter(course => examLockdown.lockedCourseIds.includes(Number(course.id)))
      .map(course => course.name || `Course ${course.id}`)
      .join(', ');
    const examLockdownMessage = courseFetchFailed
      ? 'Study Support is temporarily unavailable because your course list could not be verified.'
      : isExamStatusPending
        ? 'Checking quiz attempt status before enabling Study Support…'
        : examLockdown.status === 'error'
          ? 'Study Support is temporarily unavailable because quiz attempt status could not be verified. Try again shortly.'
          : selectedCourseId === 0
            ? `Study Support is locked because an active quiz attempt is open in ${lockedCourseNames || 'one of your courses'}. Select a course without an active attempt to continue.`
            : `Study Support is unavailable for ${currentCourseName} while you have an active quiz attempt. Submit or finalize the attempt before using course assistance.`;
    const menuItemStyle = (active) => ({
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '8px 10px',
      fontSize: 14,
      background: active ? '#EEF2FF' : 'transparent',
      color: '#0f172a',
      border: 'none',
      cursor: 'pointer',
    });
    const bottomRef = useRef(null);
    const containerRef = useRef(null);
    const [isUserScrolled, setIsUserScrolled] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [imageFileObj, setImageFileObj] = useState(null);
    const [fileObj, setFileObj] = useState(null);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isWriting, setIsWriting] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const chatIcons = [
      {src: "/icons/chat/cut.png", alt: "cut"},
      {src: "/icons/chat/gallery.png", alt: "gallery"},
      {src: "/icons/chat/document.png", alt: "document"},
      {src: "/icons/chat/link.png", alt: "link"},
      {src: "/icons/chat/video-square.png", alt: "video-square"}
    ];
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    
    const [selectedDialogueId, setSelectedDialogueId] = useState(getSavedDialogueId);
    
    
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    const [recentPrompts, setRecentPrompts] = useState([]);
    const [isRecentPromptsFetched, setIsRecentPromptsFetched] = useState(false);
    
    useEffect(() => {
      bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);
    
    useEffect(() => {
      if (props.showHistory) {
        fetchRecentPrompts();
        setIsDrawerOpen(true);
      } else {
        setIsDrawerOpen(false);
      }
    }, [props.showHistory]);
    
    // Auto scroll to bottom when user is not scrolling
    useEffect(() => {
      if (messages.length === 0) return;
      if (!isWriting) return;
      if (isUserScrolled) return;
      
      const container = containerRef.current;
      if (!container) return;
      
      const checkScrollPosition = () => {
        const {scrollTop, scrollHeight, clientHeight} = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isNearBottom) {
          bottomRef.current?.scrollIntoView({behavior: 'smooth'});
        }
      };
      
      const interval = setInterval(checkScrollPosition, 250); // Adjust as needed
      
      return () => clearInterval(interval);
    }, [isWriting, isUserScrolled, messages]);
    
    const isImageFile = (fileName) => {
      if (!fileName || typeof fileName !== 'string') return false;
      
      const ext = fileName.split('.').pop().toLowerCase();
      const isImageExt = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext);
      
      const endsWithBlob = fileName.toLowerCase().endsWith('blob');
      
      return isImageExt || endsWithBlob;
    };
    const processChatImage = async (fileName) => {
      if (!fileName) return {imageSrc: null, fileObj: null};
      if (typeof fileName === 'string' && (/^https?:\/\//i.test(fileName) || fileName.startsWith('/'))) {
        return {imageSrc: toFullURL(fileName), fileObj: null};
      }
      return {imageSrc: null, fileObj: {name: fileName.split('/').pop?.() || String(fileName)}};
    };
    
    const getFileIcon = (fileName) => {
      if (!fileName || typeof fileName !== 'string') return null;
      const ext = fileName.split('.').pop().toLowerCase();
      switch (ext) {
        case 'pdf':
          return "/icons/add-content/pdf.png";
        case 'ppt':
        case 'pptx':
          return "/icons/add-content/ppt.png";
        case 'doc':
        case 'docx':
          return "/icons/add-content/doc.png";
        default:
          return "/icons/add-content/directbox-send.png";
      }
    };
    const toggleDrawer = () => {
      fetchRecentPrompts();
      setIsDrawerOpen((prev) => !prev);
      if (props.showHistory) {
        props.setShowHistory(true);
      }
    };
    
    const fetchRecentPrompts = async () => {
      console.log("fetchRecentPrompts", isRecentPromptsFetched);
      if (isRecentPromptsFetched) return;
      console.log('Fetching recent prompts...');
      try {
        const response = await axios.get(`${VITE_CHAT_API_DOMAIN}/dialogue/selectByUserId/${user.id}`, {
          headers: chatAuthHeaders(),
        });
        if (response.data.code === "200" || response.data.code === 200) {
          const filtered = response.data.data
            .map((item) => {
              const group = transformDate(item.updateTime);  // assumes updateTime is present
              return group ? {id: item.id, text: item.summary, group, updateTime: item.updateTime} : null;
            })
            .filter(Boolean)  // removes nulls
            .sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));
          setRecentPrompts(filtered);
          setIsRecentPromptsFetched(true);
        }
      } catch (err) {
        console.error('Failed to fetch prompts:', err);
      }
    };
    
    const handlePromptClick = async (prompt, isToggleDrawer = true) => {
      const idNum = Number(prompt?.id);
      if (!Number.isFinite(idNum) || idNum <= 0) return;
      
      if (isToggleDrawer) {
        toggleDrawer();
      }
      setMessages([]);
      setIsWriting(false);
      try {
        const response = await axios.get(`${VITE_CHAT_API_DOMAIN}/dialogue/selectById/${idNum}`, {
          headers: chatAuthHeaders(),
        });
        if (response.data.code === "200" || response.data.code === 200) {
          const rawChats = response.data.data.chats;
          const chat_messages = (
            await Promise.all(
              rawChats.map(async (chat) => {
                const userMedia = await processChatImage(chat.queryImage, user.accessToken);
                const botMedia = await processChatImage(chat.answerImage, user.accessToken);
                
                return [
                  {
                    sender: 'user',
                    text: chat.queryText,
                    time: chat.time,
                    ...userMedia
                  },
                  {
                    sender: 'bot',
                    text: chat.answerText,
                    time: chat.time,
                    ...botMedia
                  }
                ];
              })
            )
          ).flat();
          setMessages(chat_messages);
          setSelectedDialogueId(idNum);
        }
      } catch (err) {
        console.error('Failed to fetch prompt:', err);
      }
      
    };
    
    
    const handleNewChat = async () => {
      setMessages([]);
      setIsWriting(false);
      setSelectedDialogueId(-1);
      setInput('');
      setImageSrc(null);
      setImageFileObj(null);
      setFileObj(null);
    };
    
    // expose the method to parent
    useImperativeHandle(ref, () => ({
      handleNewChat
    }));

// replace existing handleSend with this:
    const handleSend = async (overrideText, overrideCourseId) => {
      const question = (overrideText ?? input)?.trim();
      if (!question || isStudySupportUnavailable) return;
      
      const courseForSend = (typeof overrideCourseId === 'number')
        ? overrideCourseId
        : (selectedCourseId || 0);
      
      // build optimistic user bubble
      setIsWriting(false);
      if (overrideText == null) {
        setMessages(prev => [
          ...prev,
          {text: question, sender: 'user', imageSrc: imageSrc || null, fileObj: fileObj || null}
        ]);
      }
      
      // clear input ONLY if we’re sending from the chat box
      if (overrideText == null) setInput('');
      
      const tempImageFileObj = imageFileObj;
      const tempFileObj = fileObj;
      removeImage();
      removeFile();
      
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('courseId', String(courseForSend));
      formData.append('query', question);
      formData.append('dialogueId', selectedDialogueId);
      formData.append('userId', user.id);
      
      if (tempImageFileObj) formData.append('file', tempImageFileObj);
      else if (tempFileObj) formData.append('file', tempFileObj);
      
      try {
        const response = await axios.post(`${VITE_CHAT_API_DOMAIN}/query`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...chatAuthHeaders(),
          },
        });
        
        setIsLoading(false);
        
        const raw = response.data?.data || {};
        const newMessage = {
          text: raw.answer,
          sender: 'chatbot',
          imageSrc: raw.imageURL ? toFullURL(raw.imageURL) : null,
        };
        setMessages(prev => [...prev, newMessage]);
        setIsWriting(true);
        
        const dd = response?.data?.data ?? {};
        const queryIdRaw = dd.queryId ?? dd.id ?? dd.dialogueId;
        const queryIdNum = Number(queryIdRaw);
        
        if (Number.isFinite(queryIdNum) && queryIdNum > 0) {
          const followUp = await axios.get(
            `${VITE_CHAT_API_DOMAIN}/dialogue/selectById/${queryIdNum}`,
            {headers: chatAuthHeaders()}
          );
          const promptData = followUp?.data?.data;
          
          if (selectedDialogueId === -1) {
            setSelectedDialogueId(queryIdNum);
            setRecentPrompts(prev => [
              {
                id: promptData?.id ?? queryIdNum,
                text: promptData?.summary ?? (question.slice(0, 60) + (question.length > 60 ? '…' : '')),
                group: transformDate(promptData?.updateTime) ?? 'Today',
                updateTime: promptData?.updateTime
              },
              ...prev
            ]);
          } else {
            setRecentPrompts(prev => [
              {
                id: promptData?.id ?? queryIdNum,
                text: promptData?.summary ?? (question.slice(0, 60) + (question.length > 60 ? '…' : '')),
                group: transformDate(promptData?.updateTime) ?? 'Today'
              },
              ...prev.filter(item => item.id !== (promptData?.id ?? queryIdNum))
            ]);
          }
        } else {
          console.warn('Missing queryId in /query response:', dd);
        }
      } catch (error) {
        console.error('Error during submission:', error);
        setIsLoading(false);
      }
    };
    
    const handleSendClick = () => {
      if (!input.trim() || isStudySupportUnavailable) return;
      
      if (props.isDashboard) {
        const payload = {text: input.trim(), courseId: selectedCourseId ?? 0};
        sessionStorage.setItem(
          'pendingChat',
          JSON.stringify({
            ...payload,
            dialogueId: localStorage.getItem('dialogueId')
          })
        );
        sessionStorage.setItem('hydrateThenSend', '1');
        localStorage.setItem('selectedCourseId', String(payload.courseId));
        navigate('/aibot');
        return;
      }
      
      handleSend();
    };
    
    // useEffect to save dialogueId on local storage
    useEffect(() => {
      // console.log("selectedDialogueId", selectedDialogueId);
      localStorage.setItem('dialogueId', selectedDialogueId);
      // console.log("localStorage.getItem('dialogueId')", localStorage.getItem('dialogueId'));
    }, [selectedDialogueId]);
    
    useEffect(() => {
      console.log("localStorage.getItem('dialogueId')", localStorage.getItem('dialogueId'));
    }, [localStorage.getItem('dialogueId')]);
    
    // whenwever we refresh or switch tabs, we need to get the dialogueId from local storage
    useEffect(() => {
      const id = getSavedDialogueId();
      if (id > 0) {
        handlePromptClick({id}, false);
      } else {
        localStorage.setItem('dialogueId', '-1');
      }
    }, []);

    useEffect(() => {
      if (props.isDashboard) return;
      
      const raw = sessionStorage.getItem('pendingChat');
      if (!raw) return;
      if (isExamStatusPending) return;
      
      sessionStorage.removeItem('pendingChat');
      
      (async () => {
        try {
          const {text, courseId, dialogueId} = JSON.parse(raw) || {};
          if (typeof courseId !== 'undefined') {
            setSelectedCourseId(Number(courseId));
            localStorage.setItem('selectedCourseId', String(courseId));
          }
          if (examLockdown.status !== 'unlocked') {
            if (text && text.trim()) setInput(text.trim());
            return;
          }
          if (text && text.trim()) {
            const shouldHydrate = sessionStorage.getItem('hydrateThenSend') === '1';
            if (shouldHydrate && dialogueId && dialogueId !== '-1') {
              await handlePromptClick({id: dialogueId}, false);
            }
            setMessages(prev => [
              ...prev,
              {text: text.trim(), sender: 'user', imageSrc: null, fileObj: null}
            ]);
            await handleSend(text.trim(), typeof courseId === 'number' ? courseId : undefined);
          }
        } catch (e) {
          console.error('Failed to parse pendingChat payload', e);
          
        } finally {
          sessionStorage.removeItem('hydrateThenSend');
          handoffRef.current = false;
        }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.isDashboard, isExamStatusPending, examLockdown.status]);
    
    
    const handleIconClick = (icon) => {
      if (icon.alt === 'gallery') {
        imageInputRef.current.click(); // Trigger file input
      } else if (icon.alt === 'document') {
        fileInputRef.current.click(); // Trigger file input
      }
    };
    
    const handleImageChange = (event) => {
      const file = event.target.files[0];
      setImageFileObj(file);
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageSrc(e.target.result); // same as when uploaded via file input
        };
        reader.readAsDataURL(file);
        event.preventDefault(); // stop browser from inserting image in text input
      }
    };
    
    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        setFileObj(file);
      }
    };
    const removeImage = () => {
      setImageSrc(null);
      setImageFileObj(null);
      imageInputRef.current.value = ""; // Clear the file input
    };
    
    const removeFile = () => {
      setFileObj(null);
      fileInputRef.current.value = ""; // Clear the file input
    };
    
    useEffect(() => {
      const handlePaste = (event) => {
        const items = event.clipboardData?.items;
        if (!items) return;
        
        for (const item of items) {
          if (item.type.indexOf("image") === 0) {
            const file = item.getAsFile();
            setImageFileObj(file);
            const reader = new FileReader();
            reader.onload = (e) => {
              setImageSrc(e.target.result); // same as when uploaded via file input
            };
            reader.readAsDataURL(file);
            event.preventDefault(); // stop browser from inserting image in text input
            break;
          } else if (item.type.indexOf("application") === 0) {
            const file = item.getAsFile();
            setFileObj(file);
            event.preventDefault(); // stop browser from inserting image in text input
            break;
          }
          
        }
      };
      
      window.addEventListener("paste", handlePaste);
      return () => window.removeEventListener("paste", handlePaste);
    }, []);
    
    return (
      <>
        {/* Back‑drop & Drawer */}
        {isDrawerOpen && (
          <>
            {/* darkened background */}
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={toggleDrawer}
            />
            
            {/* sliding panel */}
            <div
              className="fixed z-50 inset-y-4 left-2 w-80 bg-white shadow-2xl rounded-xl overflow-visible flex flex-col animate-slideIn"
              style={{animation: 'slideIn 0.25s ease-out forwards'}}
            >
              {/* header */}
              <div className="relative px-6 py-4">
                <h2 className="text-lg font-semibold">Recent prompt</h2>
                
                {/* close arrow */}
                <button
                  onClick={toggleDrawer}
                  className="absolute -right-5 top-1/2 -translate-y-1/2 bg-[#EDF2F7] hover:bg-[#E2E8F0] transition-colors shadow-md rounded-xl p-[6px] cursor-pointer"
                >
                  <img
                    src="/icons/chat/recent-prompt/receive-square.png"
                    alt="close drawer"
                    className="w-5 h-5"
                  />
                </button>
              </div>
              
              {/* body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-hide">
                {['Today', 'Yesterday', 'Previous 7 Days'].map((grp) => (
                  <div key={grp} className="space-y-1">
                    <p className="text-xs font-medium text-slate-400 mb-1">{grp}</p>
                    {recentPrompts
                      .filter((p) => p.group === grp)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handlePromptClick(p)}
                          className="block text-left w-full text-sm text-slate-700 truncate hover:bg-slate-100 rounded-lg px-3 py-2"
                        >
                          {p.text}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </div>
            
            {/* keyframes */}
            <style>{`
                        @keyframes slideIn {
                            from {
                                transform: translateX(-100%);
                            }
                            to {
                                transform: translateX(0%);
                            }
                        }
                    `}</style>
          </>
        )}
        
        {(props.isDashboard || props.isPopup) && (
          <>
            <div className={styles.chatHeader}>
              {/* menu icon with drawer toggle */}
              <button
                type="button"
                className={styles.chatMenu}
                onClick={toggleDrawer}
                aria-label="Open chat history"
              >
                <img src="/icons/chat/menu.png" alt=""/>
              </button>
              <div className={styles.chatTitle}>
                <h1 className="text-[1.5rem] font-medium">New Chat</h1>
              </div>
              <div className={styles.spacer}/>
              <button className={styles.glassButton} onClick={() => {
                handleNewChat()
              }}>
                <img className="w-[1.3rem]" src="/icons/chat/add_plus.png" alt="plus"/>
                <span className="text-[1rem]">New</span>
              </button>
              {props.isPopup && (
                <button
                  className={styles.glassButton}
                  onClick={() => {
                    props.setIsChatbotOpen(false);
                  }}
                >
                  <img className="w-[1.3rem]" src="/icons/add-content/close-circle.png" alt="close"/>
                </button>
              )}
            </div>
            <div className={styles.horizontalLine}/>
          </>
        )}
        {/*  Main Content */}
        <div className={`flex flex-col p-2 ${props.isDashboard ? 'h-[90%]' : props.isSummary ? 'h-[87%]' : 'h-[95%]'}`}>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" ref={containerRef}>
            {isStudySupportUnavailable ? (
              <div
                id="study-support-lockdown-message"
                className="m-auto max-w-xl rounded-xl border border-amber-300 bg-amber-50 p-5 text-left text-amber-950"
                role={courseFetchFailed || examLockdown.status === 'error' ? 'alert' : 'status'}
              >
                <strong>{examLockdown.status === 'locked' ? 'Exam lockdown active' : 'Study Support unavailable'}</strong>
                <p className="mt-2 text-sm">{examLockdownMessage}</p>
                {courseFetchFailed ? (
                  <button
                    type="button"
                    className="mt-3 rounded-lg border border-amber-500 bg-white px-3 py-2 text-sm font-semibold"
                    onClick={() => void fetchCourses()}
                  >
                    Try again
                  </button>
                ) : null}
              </div>
            ) : messages.length === 0 ? (
              props.isSummary ? (
                <div className="flex-1 flex flex-col justify-start mb-8 ml-3">
                  <div
                    className="cursor-pointer hover:bg-[#EDF2F7] transition-all duration-300 flex items-center p-4 border border-[rgba(226,232,240,1)] rounded-xl  bg-transparent max-w-xl">
                    <div className="flex-1">
                      <h3 className="text-lg text-gray-900 mb-1">Summarize it for me</h3>
                      <p className="text-sm text-[rgba(160,174,192,1)]">
                        Ripan will summarize this material as clearly as possible.
                      </p>
                    </div>
                    <div className="ml-3 mt-1">
                      <img src="/icons/roster/suggestion.png" alt="suggestion"/>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex-1 flex flex-col items-start text-left mb-8 ml-3 ${props.isIntroTop ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <h1 className="text-2xl font-bold">Welcome back, {user?.name}! 👋</h1>
                  <p className="text-sm text-gray-500 mt-2">
                    Every small step forward brings you closer to your big dream.
                  </p>
                </div>
              )
            ) : (
              // {/* Chat messages area (scrollable) */}
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[70%] px-4 py-2 rounded-xl text-base whitespace-pre-wrap break-words ${msg.sender === 'user' ? 'self-end bg-blue-100' : 'self-start bg-[rgb(203,209,241)]'
                    }`}
                  >
                    {/* text / typing animation */}
                    {isWriting && index === messages.length - 1 && msg.sender !== 'user' ? (
                      <TypingText text={msg.text} speed={5} onDone={() => setIsWriting(false)}/>
                    ) : (
                      <div className="whitespace-pre-line text-base text-gray-900">
                        {renderMessageText(msg.text)}
                      </div>
                    )}
                    {/* image preview */}
                    {msg.imageSrc && (
                      <img
                        src={msg.imageSrc}
                        data-src={msg.imageSrc}
                        alt="attached"
                        className="mb-2 w-56 md:w-120 max-h-144 object-contain rounded border"
                        onClick={(e) => setLightboxSrc(e.currentTarget.dataset.src)}
                      />
                    )}
                    
                    {/* file preview */}
                    {msg.fileObj && (
                      <div className="relative mb-2 mt-2 rounded-lg border border-[rgba(226,232,240,1)] w-fit">
                        <div className="flex items-center gap-2">
                          <img src={getFileIcon(msg.fileObj.name)} alt="file type icon"/>
                          <span className="text-sm text-gray-800">{msg.fileObj.name}</span>
                        </div>
                      </div>
                    )}
                  
                  
                  </div>
                ))}
                
                {isLoading && (
                  <div
                    className="max-w-[70%] px-4 py-2 rounded-xl text-base whitespace-pre-wrap break-words self-start bg-[rgb(203,209,241)]">
                    <div className="whitespace-pre-line text-base text-gray-900">
                      <img
                        src="/icons/chat/msg_loading.gif"
                        alt="loading"
                        style={{width: '4rem', margin: '0.4rem'}}
                      />
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </>
            )}
          </div>
          {lightboxSrc && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
              onClick={() => setLightboxSrc(null)}
            >
              <img
                src={lightboxSrc}
                alt="popup"
                className="max-w-[90%] max-h-[90%] rounded shadow-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          {/* Input area */}
          <div className={styles.chatInputContainer}>
            <div ref={courseBoxRef} style={{position: 'relative', display: 'inline-block'}}>
              <button
                type="button"
                className={styles.chatCourse}
                onClick={() => isCoursesFetched && setIsCourseOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={isCourseOpen}
                title={currentCourseName}
                disabled={!isCoursesFetched}
                style={{width: 150}}
              >
                <img className={styles.chatCourseIcon} src="/icons/ai_course.png" alt="ai-course"/>
                <p style={{
                  maxWidth: 110,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}>
                  {isCoursesFetched ? currentCourseName : 'Loading...'}
                </p>
              </button>
              
              {isCourseOpen && (
                <div
                  role="listbox"
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    zIndex: 1000,
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: 240,
                    maxHeight: 260,
                    overflowY: 'auto',
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectCourse(0)}
                    style={menuItemStyle(selectedCourseId === 0)}
                  >
                    All Courses
                  </button>
                  {courses.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => handleSelectCourse(c.id)}
                      style={menuItemStyle(Number(selectedCourseId) === Number(c.id))}
                      title={c.name}
                    >
                      {c.name || `Course ${c.id}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            
            <div className={styles.chatInputMessage}>
              {/* hidden file inputs */}
              <input
                type="file"
                ref={imageInputRef}
                style={{display: 'none'}}
                onChange={handleImageChange}
                accept="image/*"
                disabled={isStudySupportUnavailable}
              />
              <input
                type="file"
                ref={fileInputRef}
                style={{display: 'none'}}
                onChange={handleFileChange}
                disabled={isStudySupportUnavailable}
              />
              
              {/* Image Preview */}
              {imageSrc && (
                <div className="relative w-18 h-18 mb-2 mt-2">
                  <img src={imageSrc} alt="preview" className="w-full h-full object-cover rounded"/>
                  <button
                    onClick={removeImage}
                    className="cursor-pointer absolute top-[-3px] right-[-3px] bg-black border rounded-full px-[6px] text-white text-sm"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* File preview */}
              {fileObj && (
                <div className="relative mb-2 mt-2 rounded-lg p-2 border border-[rgba(226,232,240,1)] w-fit">
                  <div className="flex items-center gap-2">
                    <img src={getFileIcon(fileObj.name)} alt="file type icon"/>
                    <span className="text-sm text-gray-800">{fileObj.name}</span>
                  </div>
                  <button
                    onClick={removeFile}
                    className="cursor-pointer absolute top-[-3px] right-[-3px] bg-black border rounded-full px-[6px] text-white text-sm"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* textarea */}
              <textarea
                className={styles.chatTextarea}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendClick();
                  }
                }}
                placeholder="Please note that the AI system is not yet fully developed, and some of its responses may be inaccurate or incomplete."
                rows={3}
                disabled={isStudySupportUnavailable}
                aria-describedby={isStudySupportUnavailable ? 'study-support-lockdown-message' : undefined}
              />
            </div>
            
            {/* footer */}
            <div className={styles.chatFooter}>
              {chatIcons.map((icon, idx) => (
                <button
                  type="button"
                  key={idx}
                  className={styles.chatFooterIconButton}
                  onClick={() => handleIconClick(icon)}
                  aria-label={icon.alt}
                  disabled={isStudySupportUnavailable}
                >
                  <img className={styles.chatFooterIcon} src={icon.src} alt=""/>
                </button>
              ))}
              <div className={styles.spacer}/>
              <button type="button" className={styles.chatFooterSend} onClick={handleSendClick} disabled={isStudySupportUnavailable}>
                Send
                <img src="/icons/chat/send-star.png" alt="send-star"/>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  });

export default ChatContent;
