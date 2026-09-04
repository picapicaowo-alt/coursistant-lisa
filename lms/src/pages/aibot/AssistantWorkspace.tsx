import {FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ArrowUp, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Sparkles} from 'lucide-react';
import {useRequiredAuth} from '@/contexts/RequiredAuthContext';
import {
  aiAgentApiService,
  type AiAgentPendingAction,
  type AiAgentResponse,
  type AiAgentRole,
  type DeadlineDecision,
} from '@/apis/services/ai-agent-api';
import {getApiErrorCode} from '@/utils/apiError';
import {loadActiveChatCourses} from '@/utils/chatCourses';
import {useAiExamLockdown} from '@/hooks/useAiExamLockdown';
import DynamicThinking from '@/components/DynamicThinking/DynamicThinking';
import MarkdownMessage from '@/components/MarkdownMessage';
import {RichTextEditor} from '@/components/RichTextEditor';
import type {MyCourse} from '@/apis';
import DeadlineDecisionModal from './DeadlineDecisionModal';
import {
  buildDetailsConfirmationMessage,
  isDetailsConfirmationReply,
  isGenericAssistantReset,
  lastOriginalUserRequest,
  toChatHistory,
  type WorkflowChatMessage,
} from './workflowConversation';
import {
  ASSISTANT_PENDING_THREAD_KEY,
  createAssistantThread,
  loadAssistantThreads,
  saveAssistantThreads,
  titleFromMessage,
  type AssistantThread,
} from './assistantHistory';
import styles from './AssistantWorkspace.module.scss';

const STUDENT_PROMPTS = [
  'What assignments are due this week?',
  'Help me understand a difficult course concept.',
  'Make a study plan for this week.',
];

const INSTRUCTOR_PROMPTS = [
  'What assignments are due in the next 14 days?',
  'Summarize what needs my attention this week.',
  'Help me change an assignment deadline.',
];

const THINKING_STEPS = [
  {id: 'understand', text: 'Understanding your request.'},
  {id: 'context', text: 'Checking the relevant course context.'},
  {id: 'response', text: 'Preparing a helpful response.'},
];

const ASSISTANT_COMPACT_WIDTH = 760;

type StudentCourseLoadStatus = 'loading' | 'ready' | 'error';

const getAgentRole = (level: string | null): AiAgentRole =>
  level === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';

const getErrorMessage = (error: unknown): string => {
  const code = getApiErrorCode(error);
  if (code === 'AI_EXAM_LOCKDOWN' || code === 'QUIZ_EXAM_LOCKDOWN') {
    return 'AI assistance is not available while you have an active quiz attempt in progress.';
  }
  if (error instanceof Error) {
    if (/request failed|status code|network error/i.test(error.message)) {
      return 'The AI Assistant is temporarily unavailable. Please try again.';
    }
    return error.message.replace('Workflow is', 'The AI Assistant is');
  }
  return 'The AI Assistant is temporarily unavailable. Please try again.';
};

const formatThreadTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  }
  return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
};

const AssistantWorkspace = () => {
  const {user} = useRequiredAuth();
  const role = getAgentRole(user.level);
  const canChangeDeadlines = role === 'INSTRUCTOR';
  const quickPrompts = role === 'INSTRUCTOR' ? INSTRUCTOR_PROMPTS : STUDENT_PROMPTS;
  const initialThreads = useMemo(() => loadAssistantThreads(user.id, role), [role, user.id]);
  const requestedThreadId = useMemo(
    () => sessionStorage.getItem(ASSISTANT_PENDING_THREAD_KEY),
    [],
  );
  const [threads, setThreads] = useState<AssistantThread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState(
    () => initialThreads.some(thread => thread.id === requestedThreadId)
      ? requestedThreadId as string
      : initialThreads[0].id,
  );
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingReply, setStreamingReply] = useState('');
  const [isCompact, setIsCompact] = useState(
    () => window.matchMedia('(max-width: 760px)').matches,
  );
  const [historyOpen, setHistoryOpen] = useState(() => !isCompact);
  const [pendingAction, setPendingAction] = useState<AiAgentPendingAction | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState('');
  const [awaitingDetailsConfirmation, setAwaitingDetailsConfirmation] = useState(false);
  const [detailsConfirmation, setDetailsConfirmation] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [studentCourses, setStudentCourses] = useState<MyCourse[]>([]);
  const [studentCourseLoadStatus, setStudentCourseLoadStatus] =
    useState<StudentCourseLoadStatus>('loading');
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<HTMLElement | null>(null);
  const historyToggleRef = useRef<HTMLButtonElement | null>(null);
  const historyCloseRef = useRef<HTMLButtonElement | null>(null);
  const chatRef = useRef<HTMLElement | null>(null);
  const handoffConsumedRef = useRef(false);
  const nextMessageId = useRef(
    Math.max(1, ...initialThreads.flatMap(thread => thread.messages.map(message => message.id + 1))),
  );

  const activeThread = threads.find(thread => thread.id === activeThreadId) ?? threads[0];
  const messages = activeThread.messages;
  const blockingDecision = Boolean(pendingAction) || awaitingDetailsConfirmation;
  const showWelcome = messages.length === 1 && !isSending;

  useEffect(() => {
    if (role !== 'STUDENT') return;

    let cancelled = false;
    setStudentCourseLoadStatus('loading');

    void loadActiveChatCourses()
      .then(courses => {
        if (cancelled) return;
        setStudentCourses(courses);
        setStudentCourseLoadStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStudentCourses([]);
        setStudentCourseLoadStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [role, user.id]);

  const studentExamLockdown = useAiExamLockdown(
    studentCourses.map(course => Number(course.id)),
    user.id,
    role === 'STUDENT'
      && studentCourseLoadStatus === 'ready',
  );
  const isStudentSupportReady = role !== 'STUDENT' || (
    studentCourseLoadStatus === 'ready'
    && studentExamLockdown.status === 'unlocked'
  );
  const studentSupportStatusMessage = role !== 'STUDENT'
    ? null
    : studentCourseLoadStatus === 'loading'
      ? 'Loading your course context…'
      : studentCourseLoadStatus === 'error'
        ? 'Coursistant is temporarily unavailable because your course list could not be verified.'
        : studentExamLockdown.status === 'checking'
          ? 'Checking quiz attempt status before enabling Coursistant…'
          : studentExamLockdown.status === 'locked'
            ? 'Coursistant is unavailable while you have an active quiz attempt.'
            : studentExamLockdown.status === 'error'
              ? 'Coursistant is temporarily unavailable because quiz attempt status could not be verified.'
              : null;

  useEffect(() => {
    saveAssistantThreads(user.id, threads);
  }, [threads, user.id]);

  useEffect(() => {
    if (requestedThreadId) sessionStorage.removeItem(ASSISTANT_PENDING_THREAD_KEY);
  }, [requestedThreadId]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }, [activeThreadId, awaitingDetailsConfirmation, isSending, messages, pendingAction, streamingReply]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    let compactMode = window.matchMedia('(max-width: 760px)').matches;
    const applyWidth = (width: number) => {
      const nextCompactMode = width <= ASSISTANT_COMPACT_WIDTH;
      if (nextCompactMode === compactMode) return;
      compactMode = nextCompactMode;
      setIsCompact(nextCompactMode);
      setHistoryOpen(!nextCompactMode);
    };

    applyWidth(workspace.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => applyWidth(entries[0].contentRect.width));
    observer.observe(workspace);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.inert = isCompact && historyOpen;
  }, [historyOpen, isCompact]);

  const closeHistory = useCallback((restoreFocus = true) => {
    setHistoryOpen(false);
    if (restoreFocus) requestAnimationFrame(() => historyToggleRef.current?.focus());
  }, []);

  const toggleHistory = useCallback(() => {
    if (historyOpen) {
      closeHistory();
      return;
    }
    setHistoryOpen(true);
    if (isCompact) requestAnimationFrame(() => historyCloseRef.current?.focus());
  }, [closeHistory, historyOpen, isCompact]);

  useEffect(() => {
    if (!isCompact || !historyOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeHistory();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        historyRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && (document.activeElement === first || !historyRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeHistory, historyOpen, isCompact]);

  const updateActiveThread = (updater: (thread: AssistantThread) => AssistantThread) => {
    setThreads(current => current.map(thread => thread.id === activeThreadId ? updater(thread) : thread));
  };

  const addMessage = (sender: WorkflowChatMessage['sender'], text: string) => {
    updateActiveThread(thread => ({
      ...thread,
      title: sender === 'user' && thread.title === 'New conversation'
        ? titleFromMessage(text)
        : thread.title,
      updatedAt: Date.now(),
      messages: [...thread.messages, {id: nextMessageId.current++, sender, text}],
    }));
  };

  const setConversationId = (conversationId: string | null) => {
    if (!conversationId) return;
    updateActiveThread(thread => ({...thread, conversationId, updatedAt: Date.now()}));
  };

  const clearApprovalState = () => {
    setPendingAction(null);
    setPendingConfirmation('');
    setAwaitingDetailsConfirmation(false);
    setDetailsConfirmation('');
    setDecisionError(null);
  };

  const applyAgentResponse = (response: AiAgentResponse, options?: {afterDetailsConfirm?: boolean}) => {
    setConversationId(response.conversationId);

    if (!response.pendingAction && !response.reply.trim()) {
      clearApprovalState();
      addMessage('agent', 'The AI Assistant returned an empty response. Please try again.');
      return;
    }

    if (response.pendingAction && !canChangeDeadlines) {
      clearApprovalState();
      addMessage('agent', 'Students can view assignment deadlines, but only instructors can change them.');
      return;
    }

    if (response.pendingAction) {
      setPendingAction(response.pendingAction);
      setPendingConfirmation(response.reply);
      setAwaitingDetailsConfirmation(false);
      setDetailsConfirmation('');
      setDecisionError(null);
      return;
    }

    const needsDetailsConfirmation = canChangeDeadlines && (
      response.confirmationRequired || isDetailsConfirmationReply(response.reply)
    );

    if (needsDetailsConfirmation) {
      addMessage('agent', response.reply);
      setPendingAction(null);
      setPendingConfirmation('');
      setAwaitingDetailsConfirmation(true);
      setDetailsConfirmation(response.reply);
      setDecisionError(null);
      return;
    }

    if (options?.afterDetailsConfirm && isGenericAssistantReset(response.reply)) {
      clearApprovalState();
      addMessage(
        'agent',
        'Those details were confirmed, but the approval step did not continue. Please send the full deadline change again.',
      );
      return;
    }

    clearApprovalState();
    addMessage('agent', response.reply);
  };

  const sendMessage = async (
    message: string,
    options?: {displayText?: string; afterDetailsConfirm?: boolean},
  ) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || pendingAction) return;
    if (awaitingDetailsConfirmation && !options?.afterDetailsConfirm) return;
    if (role === 'STUDENT' && !isStudentSupportReady) return;

    const requestThread = activeThread;
    addMessage('user', options?.displayText ?? trimmedMessage);
    setInput('');
    setDecisionError(null);
    if (!options?.afterDetailsConfirm) clearApprovalState();
    setIsSending(true);
    setStreamingReply('');

    try {
      const history = toChatHistory(requestThread.messages);
      const response = await aiAgentApiService.chat({
        message: trimmedMessage,
        role,
        ...(requestThread.conversationId ? {conversationId: requestThread.conversationId} : {}),
        ...(history.length ? {history} : {}),
      }, {onReply: setStreamingReply});
      applyAgentResponse(response, {afterDetailsConfirm: options?.afterDetailsConfirm});
    } catch (error) {
      addMessage('agent', getErrorMessage(error));
      if (options?.afterDetailsConfirm) setDecisionError(getErrorMessage(error));
    } finally {
      setStreamingReply('');
      setIsSending(false);
    }
  };

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  useEffect(() => {
    if (handoffConsumedRef.current) return;
    if (role === 'STUDENT' && !isStudentSupportReady) return;
    const raw = sessionStorage.getItem('pendingChat');
    if (!raw) return;
    handoffConsumedRef.current = true;
    sessionStorage.removeItem('pendingChat');

    try {
      const payload: unknown = JSON.parse(raw);
      if (payload && typeof payload === 'object' && 'text' in payload) {
        const text = (payload as {text?: unknown}).text;
        if (typeof text === 'string' && text.trim()) void sendMessageRef.current(text);
      }
    } catch {
      // Invalid handoff data is discarded so the Assistant remains usable.
    }
  }, [isStudentSupportReady, role]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleNewChat = () => {
    if (isSending || blockingDecision) return;
    const thread = createAssistantThread(role);
    setThreads(current => [thread, ...current]);
    setActiveThreadId(thread.id);
    setInput('');
    clearApprovalState();
    if (isCompact && historyOpen) closeHistory();
  };

  const handleSelectThread = (threadId: string) => {
    if (threadId === activeThreadId) {
      if (isCompact) closeHistory();
      return;
    }
    if (isSending || blockingDecision) return;
    setActiveThreadId(threadId);
    setInput('');
    clearApprovalState();
    if (isCompact) closeHistory();
  };

  const handleConfirmDetails = () => {
    if (!canChangeDeadlines || !awaitingDetailsConfirmation || isSending) return;
    void sendMessage(
      buildDetailsConfirmationMessage(lastOriginalUserRequest(messages)),
      {displayText: 'Confirm', afterDetailsConfirm: true},
    );
  };

  const handleCancelDetails = () => {
    if (isSending) return;
    clearApprovalState();
    addMessage('user', 'Cancel');
    addMessage('agent', 'The deadline change was cancelled. Send a new request when you are ready.');
  };

  const handleDecision = async (decision: DeadlineDecision) => {
    if (!canChangeDeadlines || !pendingAction || isSending) return;
    setDecisionError(null);
    setIsSending(true);

    try {
      const response = await aiAgentApiService.decideDeadlineChange({
        actionId: pendingAction.actionId,
        decision,
      });
      addMessage(
        'agent',
        response.reply || (decision === 'ALLOW'
          ? 'The deadline change was approved.'
          : 'The deadline change was rejected.'),
      );
      setConversationId(response.conversationId);
      setPendingAction(response.pendingAction);
      setPendingConfirmation(response.pendingAction ? response.reply : '');
    } catch (error) {
      setDecisionError(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  const inputPlaceholder = pendingAction
    ? 'Approve or reject the pending change above.'
    : awaitingDetailsConfirmation
      ? 'Confirm or cancel the details above.'
      : 'Ask about a course, deadline, or task...';
  const composerDisabled = isSending || blockingDecision || !isStudentSupportReady;

  return (
    <div ref={workspaceRef} className={`${styles.workspace} ${historyOpen ? '' : styles.historyClosed}`}>
      <aside ref={historyRef} id="assistant-history" className={styles.history} aria-label="Chat history">
        <div className={styles.historyHeader}>
          <h2>Your conversations</h2>
          <div className={styles.historyActions}>
            <button
              ref={historyCloseRef}
              type="button"
              className={styles.historyCloseButton}
              onClick={() => closeHistory()}
              aria-label="Close chat history"
            >
              <PanelLeftClose aria-hidden="true"/>
            </button>
            <button
              type="button"
              className={styles.newChatButton}
              onClick={handleNewChat}
              disabled={isSending || blockingDecision}
              aria-label="Start a new chat"
            >
              <Plus aria-hidden="true"/>
            </button>
          </div>
        </div>

        <div className={styles.threadList}>
          {threads.map(thread => (
            <button
              type="button"
              key={thread.id}
              className={`${styles.thread} ${thread.id === activeThreadId ? styles.activeThread : ''}`}
              onClick={() => handleSelectThread(thread.id)}
              disabled={isSending || blockingDecision}
              aria-pressed={thread.id === activeThreadId}
            >
              <MessageSquare aria-hidden="true"/>
              <span>
                <strong>{thread.title}</strong>
                <small>{formatThreadTime(thread.updatedAt)}</small>
              </span>
            </button>
          ))}
        </div>

        <p className={styles.storageNote}>History is saved on this browser.</p>
      </aside>

      <button
        type="button"
        className={styles.historyScrim}
        onClick={() => closeHistory()}
        aria-label="Close chat history"
        tabIndex={-1}
      />

      <section ref={chatRef} className={styles.chat} aria-labelledby="assistant-title">
        <header className={styles.chatHeader}>
          <button
            ref={historyToggleRef}
            type="button"
            className={styles.historyToggle}
            onClick={toggleHistory}
            aria-label={historyOpen ? 'Hide chat history' : 'Show chat history'}
            aria-expanded={historyOpen}
            aria-controls="assistant-history"
          >
            {historyOpen ? <PanelLeftClose aria-hidden="true"/> : <PanelLeftOpen aria-hidden="true"/>}
          </button>
          <span className={styles.assistantMark} aria-hidden="true"><Sparkles/></span>
          <div>
            <h1 id="assistant-title">Coursistant</h1>
            <p>One assistant for learning, planning, and LMS tasks</p>
          </div>
          <button
            type="button"
            className={styles.mobileNewChat}
            onClick={handleNewChat}
            disabled={isSending || blockingDecision}
            aria-label="Start a new chat"
          >
            <Plus aria-hidden="true"/>
          </button>
        </header>

        <div className={styles.conversation} aria-busy={isSending}>
          {showWelcome ? (
            <div className={styles.welcome}>
              <span className={styles.welcomeIcon} aria-hidden="true"><Sparkles/></span>
              <h2>How can I help today?</h2>
              <p>Ask a question or choose a starting point.</p>
              <div className={styles.quickPrompts} role="group" aria-label="Suggested prompts">
                {quickPrompts.map(prompt => (
                  <button
                    type="button"
                    key={prompt}
                    disabled={!isStudentSupportReady}
                    onClick={() => void sendMessage(prompt)}
                  >
                    {prompt}
                    <ArrowUp aria-hidden="true"/>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div
            className={styles.messages}
            role="log"
            aria-label="Conversation"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {messages.slice(1).map(message => (
              <article
                key={message.id}
                className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.agentMessage}`}
              >
                <span className={styles.srOnly}>
                  {message.sender === 'user' ? 'You' : 'Coursistant'}:
                </span>
                {message.sender === 'agent' ? <span className={styles.messageMark} aria-hidden="true"><Sparkles/></span> : null}
                <div><MarkdownMessage content={message.text}/></div>
              </article>
            ))}
            {streamingReply ? (
              <article className={`${styles.message} ${styles.agentMessage}`}>
                <span className={styles.srOnly}>Coursistant:</span>
                <span className={styles.messageMark} aria-hidden="true"><Sparkles/></span>
                <div><MarkdownMessage content={streamingReply}/></div>
              </article>
            ) : null}
            {isSending && !streamingReply ? (
              <div className={styles.thinking}>
                <DynamicThinking
                  label="Coursistant is thinking"
                  fallbackSteps={THINKING_STEPS}
                />
              </div>
            ) : null}
            <div ref={conversationEndRef}/>
          </div>
        </div>

        {studentSupportStatusMessage ? (
          <p className={styles.supportStatus} role="status">{studentSupportStatusMessage}</p>
        ) : null}

        <form className={styles.composer} onSubmit={handleSubmit}>
          <RichTextEditor
            className={styles.editor}
            variant="composer"
            showToolbar={false}
            content={input}
            onChange={setInput}
            onSubmit={() => void sendMessage(input)}
            placeholder={inputPlaceholder}
            disabled={composerDisabled}
            ariaLabel="Message Coursistant"
          />
          <button
            type="submit"
            disabled={composerDisabled || !input.trim()}
            aria-label="Send message"
          >
            <ArrowUp aria-hidden="true"/>
          </button>
        </form>

        {canChangeDeadlines && awaitingDetailsConfirmation && !pendingAction ? (
          <DeadlineDecisionModal
            title="Confirm assignment details"
            eyebrow="Review details"
            confirmationText={detailsConfirmation}
            warningText="Confirming continues to the deadline approval step. The due date has not changed yet."
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            errorMessage={decisionError}
            isSubmitting={isSending}
            onDecision={decision => {
              if (decision === 'ALLOW') handleConfirmDetails();
              else handleCancelDetails();
            }}
          />
        ) : null}

        {canChangeDeadlines && pendingAction ? (
          <DeadlineDecisionModal
            confirmationText={pendingConfirmation}
            errorMessage={decisionError}
            isSubmitting={isSending}
            onDecision={decision => void handleDecision(decision)}
          />
        ) : null}
      </section>
    </div>
  );
};

export default AssistantWorkspace;
