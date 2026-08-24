import type {StudySupportProgress} from './studySupportStream';
import type {ThinkingStep} from '@/components/DynamicThinking/DynamicThinking';

const SAFE_PHASE_COPY: Readonly<Record<string, string>> = {
  understand: 'Understanding your question.',
  thinking: 'Understanding your question.',
  route: 'Choosing the right support workflow.',
  routing: 'Choosing the right support workflow.',
  search: 'Searching your course materials.',
  retrieval: 'Searching your course materials.',
  context: 'Reviewing the relevant course context.',
  tool: 'Checking the relevant LMS context.',
  tools: 'Checking the relevant LMS context.',
  writing: 'Preparing a clear response.',
  answer: 'Preparing a clear response.',
  response: 'Preparing a clear response.',
};

export const safeStudySupportProgress = (
  progress: StudySupportProgress,
  id: string,
): ThinkingStep => ({
  id,
  text: SAFE_PHASE_COPY[progress.phase.trim().toLowerCase()] ?? 'Working on your request.',
});
