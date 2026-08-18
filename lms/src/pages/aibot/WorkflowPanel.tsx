import {FormEvent, KeyboardEvent, useEffect, useRef, useState} from 'react';
import {useRequiredAuth} from '@/contexts/RequiredAuthContext';
import {
  aiAgentApiService,
  type AiAgentPendingAction,
  type AiAgentRole,
  type DeadlineDecision,
} from '@/apis/services/ai-agent-api';
import styles from './index.module.scss';

interface WorkflowMessage {
  id: number;
  sender: 'user' | 'agent';
  text: string;
}

const QUICK_PROMPTS = [
  'What assignments are due in the next 14 days?',
  'List my courses.',
  'Help me change an assignment deadline.',
];

const getAgentRole = (level: string | null): AiAgentRole =>
  level === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'Workflow is temporarily unavailable. Please try again.';
};

const WorkflowPanel = () => {
  const {user} = useRequiredAuth();
  const role = getAgentRole(user.level);
  const nextMessageId = useRef(1);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingAction, setPendingAction] = useState<AiAgentPendingAction | null>(null);
  const [messages, setMessages] = useState<WorkflowMessage[]>([
    {
      id: 0,
      sender: 'agent',
      text: role === 'INSTRUCTOR'
        ? 'I can check your courses and teaching deadlines, or prepare an assignment deadline change for your approval.'
        : 'I can check your courses and upcoming assignment deadlines.',
    },
  ]);

  const roleLabel = role === 'INSTRUCTOR' ? 'Instructor workflow' : 'Student workflow';

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }, [isSending, messages, pendingAction]);

  const addMessage = (sender: WorkflowMessage['sender'], text: string) => {
    setMessages(current => [
      ...current,
      {id: nextMessageId.current++, sender, text},
    ]);
  };

  const sendMessage = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || pendingAction) return;

    addMessage('user', trimmedMessage);
    setInput('');
    setIsSending(true);

    try {
      const response = await aiAgentApiService.chat({message: trimmedMessage, role});
      addMessage('agent', response.reply);
      setPendingAction(response.pendingAction);
    } catch (error) {
      addMessage('agent', getErrorMessage(error));
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

  const handleDecision = async (decision: DeadlineDecision) => {
    if (!pendingAction || isSending) return;
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
      setPendingAction(response.pendingAction);
    } catch (error) {
      addMessage('agent', getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

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
        {QUICK_PROMPTS.map(prompt => (
          <button
            type="button"
            key={prompt}
            onClick={() => void sendMessage(prompt)}
            disabled={isSending || Boolean(pendingAction)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className={styles.workflowConversation} aria-live="polite" aria-busy={isSending}>
        <div className={styles.rolePill}>{roleLabel}</div>
        {messages.map(message => (
          <div
            key={message.id}
            className={`${styles.message} ${message.sender === 'user' ? styles.userMessage : styles.agentMessage}`}
          >
            {message.text}
          </div>
        ))}

        {pendingAction ? (
          <div className={styles.confirmation} role="alert">
            <strong>Approval required</strong>
            <p>The Agent prepared an assignment deadline change. Review the details above before continuing.</p>
            <div className={styles.confirmationActions}>
              <button type="button" onClick={() => void handleDecision('REJECT')} disabled={isSending}>
                Reject
              </button>
              <button type="button" className={styles.allowButton} onClick={() => void handleDecision('ALLOW')} disabled={isSending}>
                Allow change
              </button>
            </div>
          </div>
        ) : null}

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
          placeholder={pendingAction ? 'Approve or reject the pending change above.' : 'Tell Workflow what to do…'}
          disabled={isSending || Boolean(pendingAction)}
          rows={3}
        />
        <div className={styles.inputFooter}>
          <span>Enter to send · Shift+Enter for a new line</span>
          <button type="submit" disabled={isSending || Boolean(pendingAction) || !input.trim()}>
            Run
          </button>
        </div>
      </form>
    </section>
  );
};

export default WorkflowPanel;
