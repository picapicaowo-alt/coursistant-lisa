import {ChangeEvent, FormEvent, KeyboardEvent, useMemo, useState} from 'react';
import {ChevronRight, MessageSquareText, SendHorizontal} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useRequiredAuth} from '@/contexts/RequiredAuthContext';
import {
  ASSISTANT_PENDING_THREAD_KEY,
  loadAssistantThreads,
} from '@/pages/aibot/assistantHistory';
import styles from './AskAssistant.module.scss';

const QUICK_PROMPTS = [
  'Explain my next assignment',
  "Summarize this week's lessons",
  'Create a study plan',
] as const;

const AskAssistant = () => {
  const navigate = useNavigate();
  const {user} = useRequiredAuth();
  const [question, setQuestion] = useState('');
  const role = user.level === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT';
  const recentThread = useMemo(
    () => loadAssistantThreads(user.id, role).find(thread =>
      thread.messages.some(message => message.sender === 'user')),
    [role, user.id],
  );

  const launchQuestion = (message: string) => {
    const text = message.trim();
    if (!text) return;

    sessionStorage.setItem('pendingChat', JSON.stringify({text}));
    navigate('/aibot');
  };

  const openAssistant = () => launchQuestion(question);

  const openFollowUp = () => {
    if (!recentThread) {
      launchQuestion(QUICK_PROMPTS[0]);
      return;
    }
    sessionStorage.setItem(ASSISTANT_PENDING_THREAD_KEY, recentThread.id);
    navigate('/aibot');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openAssistant();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      openAssistant();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    setQuestion(textarea.value);
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(64, Math.min(textarea.scrollHeight, 112))}px`;
  };

  return (
    <section className={styles.section} aria-labelledby="ask-assistant-title">
      <div className={styles.intro}>
        <div className={styles.identity}>
          <h2 id="ask-assistant-title">Coursistant AI</h2>
          <p>Course-aware intelligence, built into your learning.</p>
        </div>
      </div>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <textarea
          id="dashboard-assistant-question"
          value={question}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask, plan, or get things done..."
          aria-label="Ask Coursistant AI"
          aria-describedby="dashboard-assistant-help"
          rows={3}
        />
        <span id="dashboard-assistant-help" className={styles.srOnly}>
          Press Enter to send. Press Shift and Enter for a new line.
        </span>
        <div className={styles.quickPrompts} role="group" aria-label="Quick questions">
          {QUICK_PROMPTS.map(prompt => (
            <button
              key={prompt}
              type="button"
              className={styles.quickPrompt}
              onClick={() => launchQuestion(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!question.trim()}
          aria-label="Send to AI Assistant"
        >
          <SendHorizontal aria-hidden="true"/>
        </button>
      </form>

      <div className={styles.followUp}>
        <button type="button" onClick={openFollowUp}>
          <MessageSquareText aria-hidden="true"/>
          <span>{recentThread ? 'Continue recent chat' : 'Recommended question'}</span>
          <strong>{recentThread?.title ?? QUICK_PROMPTS[0]}</strong>
          <ChevronRight aria-hidden="true"/>
        </button>
      </div>
    </section>
  );
};

export default AskAssistant;
