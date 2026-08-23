import {FormEvent, KeyboardEvent, useEffect, useRef, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import {useRequiredAuth} from '@/contexts/RequiredAuthContext';
import {
  aiAgentApiService,
  type AiAgentPendingAction,
  type AiAgentResponse,
  type AiAgentRole,
  type DeadlineDecision,
} from '@/apis/services/ai-agent-api';
import DeadlineDecisionModal from './DeadlineDecisionModal';
import {
  buildDetailsConfirmationMessage,
  isDetailsConfirmationReply,
  isGenericAssistantReset,
  lastOriginalUserRequest,
  toChatHistory,
  type WorkflowChatMessage,
} from './workflowConversation';
import {getApiErrorCode} from '@/utils/apiError';
import styles from './index.module.scss';

const READ_ONLY_QUICK_PROMPTS = [
  'What assignments are due in the next 14 days?',
  'List my courses.',
];

const INSTRUCTOR_QUICK_PROMPTS = [
  ...READ_ONLY_QUICK_PROMPTS,
  'Help me change an assignment deadline.',
];

const getAgentRole = (level: string | null): AiAgentRole =>
  // UI-only. The agent backend must derive authorization from the Bearer token.
  level === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';

const getErrorMessage = (error: unknown): string => {
  const code = getApiErrorCode(error);
  if (code === 'AI_EXAM_LOCKDOWN' || code === 'QUIZ_EXAM_LOCKDOWN') {
    return 'AI assistance is not available while you have an active quiz attempt in progress.';
  }
  if (error instanceof Error) return error.message;
  return 'Workflow is temporarily unavailable. Please try again.';
};

/** CommonMark treats a single newline as a space; keep the agent's line breaks. */
const withMarkdownLineBreaks = (text: string) =>
  text.replace(/\r\n/g, '\n').replace(/([^\n])\n(?!\n)/g, '$1  \n');

const AgentMarkdown = ({text}: {text: string}) => (
  <ReactMarkdown
    components={{
      a: ({href, children}) => (
        <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
      ),
    }}
  >
    {withMarkdownLineBreaks(text)}
  </ReactMarkdown>
);

const WorkflowPanel = () => {
  const {user} = useRequiredAuth();
  const role = getAgentRole(user.level);
  const canChangeDeadlines = role === 'INSTRUCTOR';
  const quickPrompts = canChangeDeadlines ? INSTRUCTOR_QUICK_PROMPTS : READ_ONLY_QUICK_PROMPTS;
  const nextMessageId = useRef(1);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<AiAgentPendingAction | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState('');
  const [awaitingDetailsConfirmation, setAwaitingDetailsConfirmation] = useState(false);
  const [detailsConfirmation, setDetailsConfirmation] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<WorkflowChatMessage[]>([
    {
      id: 0,
      sender: 'agent',
      text: role === 'INSTRUCTOR'
        ? 'I can check your courses and teaching deadlines, or prepare an assignment deadline change for your approval.'
        : 'I can check your courses and upcoming assignment deadlines.',
    },
  ]);

  const roleLabel = role === 'INSTRUCTOR' ? 'Instructor workflow' : 'Student workflow';
  const blockingDecision = Boolean(pendingAction) || awaitingDetailsConfirmation;

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }, [isSending, messages, pendingAction, awaitingDetailsConfirmation]);

  const addMessage = (sender: WorkflowChatMessage['sender'], text: string) => {
    setMessages(current => [
      ...current,
      {id: nextMessageId.current++, sender, text},
    ]);
  };

  const applyAgentResponse = (response: AiAgentResponse, options?: {afterDetailsConfirm?: boolean}) => {
    if (response.conversationId) {
      setConversationId(response.conversationId);
    }

    if (response.pendingAction && !canChangeDeadlines) {
      addMessage('agent', 'Students can view assignment deadlines, but only instructors can change them.');
      setAwaitingDetailsConfirmation(false);
      setDetailsConfirmation('');
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
      setAwaitingDetailsConfirmation(true);
      setDetailsConfirmation(response.reply);
      setDecisionError(null);
      return;
    }

    if (options?.afterDetailsConfirm && isGenericAssistantReset(response.reply)) {
      addMessage(
        'agent',
        'Those details were confirmed. The next step is the deadline approval dialog, but the agent reset instead of continuing. Please send the full deadline change again.',
      );
      setAwaitingDetailsConfirmation(false);
      setDetailsConfirmation('');
      return;
    }

    addMessage('agent', response.reply);
    setAwaitingDetailsConfirmation(false);
    setDetailsConfirmation('');
  };

  const sendMessage = async (
    message: string,
    options?: {displayText?: string; afterDetailsConfirm?: boolean},
  ) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || pendingAction) return;
    if (awaitingDetailsConfirmation && !options?.afterDetailsConfirm) return;

    addMessage('user', options?.displayText ?? trimmedMessage);
    setInput('');
    setDecisionError(null);
    setIsSending(true);

    try {
      const history = toChatHistory(messages);
      const response = await aiAgentApiService.chat({
        message: trimmedMessage,
        role,
        ...(conversationId ? {conversationId} : {}),
        ...(history.length ? {history} : {}),
      });
      applyAgentResponse(response, {afterDetailsConfirm: options?.afterDetailsConfirm});
    } catch (error) {
      addMessage('agent', getErrorMessage(error));
      if (options?.afterDetailsConfirm) {
        setDecisionError(getErrorMessage(error));
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
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
    setAwaitingDetailsConfirmation(false);
    setDetailsConfirmation('');
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
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }
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
      : 'Tell Workflow what to do…';

  return (
    <section className={styles.toolCard} aria-labelledby="workflow-title">
      <div className={styles.toolHeader}>
        <div className={`${styles.toolIcon} ${styles.workflowIcon}`} aria-hidden="true">W</div>
        <div>
          <h2 id="workflow-title">Workflow</h2>
          <span className={`${styles.badge} ${styles.workflowBadge}`}>Actions · Planning · Organization</span>
        </div>
      </div>
      <p className={styles.toolDescription}>
        Ask the AI Agent to inspect LMS data and complete supported tasks. Consequential changes always require approval.
      </p>
      <div className={styles.divider}/>

      <div className={styles.quickPrompts} aria-label="Suggested workflow prompts">
        <p>Try asking</p>
        {quickPrompts.map(prompt => (
          <button
            type="button"
            key={prompt}
            onClick={() => void sendMessage(prompt)}
            disabled={isSending || blockingDecision}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className={styles.workflowConversation} aria-live="polite" aria-busy={isSending}>
        <div className={styles.rolePill}>{roleLabel}</div>
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.agentMessage} ${index === messages.length - 1 ? styles.lastMessage : ''}`}
          >
            {message.sender === 'agent' ? <AgentMarkdown text={message.text}/> : message.text}
          </div>
        ))}

        {isSending ? <div className={styles.agentStatus} role="status">AI Agent is working…</div> : null}
        <div ref={conversationEndRef}/>
      </div>

      <form className={styles.workflowInput} onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="workflow-message">Tell Workflow what to do</label>
        <textarea
          id="workflow-message"
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={inputPlaceholder}
          disabled={isSending || blockingDecision}
          rows={3}
        />
        <div className={styles.inputFooter}>
          <span>Enter to send · Shift+Enter for a new line</span>
          <button type="submit" disabled={isSending || blockingDecision || !input.trim()}>
            Run
          </button>
        </div>
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
  );
};

export default WorkflowPanel;
