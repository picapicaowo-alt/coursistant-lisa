import {beforeEach, describe, expect, it} from 'vitest';
import {
  createAssistantThread,
  loadAssistantThreads,
  saveAssistantThreads,
  titleFromMessage,
} from './assistantHistory';

describe('assistantHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists chat history per signed-in user', () => {
    const thread = createAssistantThread('STUDENT');
    thread.title = 'Review Cell Biology';
    saveAssistantThreads(8, [thread]);

    expect(loadAssistantThreads(8, 'STUDENT')[0]).toMatchObject({
      id: thread.id,
      title: 'Review Cell Biology',
    });
    expect(loadAssistantThreads(9, 'STUDENT')[0].id).not.toBe(thread.id);
  });

  it('recovers with a new chat when stored data is invalid', () => {
    localStorage.setItem('coursistant.ai-assistant.history.v1.8', '{invalid');
    const threads = loadAssistantThreads(8, 'STUDENT');
    expect(threads).toHaveLength(1);
    expect(threads[0].title).toBe('New conversation');
  });

  it('turns the first question into a compact thread title', () => {
    expect(titleFromMessage('  Help   me plan this week  ')).toBe('Help me plan this week');
    expect(titleFromMessage('A'.repeat(60))).toBe(`${'A'.repeat(45)}...`);
  });
});
