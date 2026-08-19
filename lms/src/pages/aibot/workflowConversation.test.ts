import {describe, expect, it} from 'vitest';
import {
  buildDetailsConfirmationMessage,
  isDetailsConfirmationReply,
  isGenericAssistantReset,
  lastOriginalUserRequest,
  toChatHistory,
} from './workflowConversation';

describe('workflowConversation', () => {
  it('detects details confirmation and ignores generic resets', () => {
    expect(isDetailsConfirmationReply(
      'Please confirm the course code, assignment title, and the new date and time.\nIs everything correct?',
    )).toBe(true);
    expect(isDetailsConfirmationReply(
      "Could you please confirm that you would like to change the deadline for 'Testing' to August 31, 1 PM?",
    )).toBe(true);
    expect(isDetailsConfirmationReply('Hello! How can I assist you today?')).toBe(false);
    expect(isGenericAssistantReset('Hello! How can I assist you today?')).toBe(true);
  });

  it('restates the original deadline request instead of sending yes', () => {
    expect(lastOriginalUserRequest([
      {id: 0, sender: 'agent', text: 'Welcome'},
      {id: 1, sender: 'user', text: 'change Assignment 0 to August 25, 1:00 pm'},
      {id: 2, sender: 'agent', text: 'Is everything correct?'},
      {id: 3, sender: 'user', text: 'yes'},
    ])).toBe('change Assignment 0 to August 25, 1:00 pm');

    expect(buildDetailsConfirmationMessage('change Assignment 0 to August 25, 1:00 pm')).toContain(
      'Original request: change Assignment 0 to August 25, 1:00 pm',
    );
  });

  it('omits the welcome message from chat history', () => {
    expect(toChatHistory([
      {id: 0, sender: 'agent', text: 'Welcome'},
      {id: 1, sender: 'user', text: 'List my courses.'},
    ])).toEqual([
      {role: 'user', content: 'List my courses.'},
    ]);
  });
});
