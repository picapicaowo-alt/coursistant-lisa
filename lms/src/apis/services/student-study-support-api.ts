import {buildStudySupportStreamBody} from '@/utils/studySupportRequest';
import {studySupportEndpoint} from '@/utils/studySupportEndpoint';
import {readStudySupportAnswer} from '@/utils/studySupportResponse';
import {
  streamStudySupport,
  type StudySupportProgress,
} from '@/utils/studySupportStream';

export interface StudentStudySupportChatRequest {
  courseId: number;
  message: string;
  accessToken: string;
  timeZone: string;
  onProgress?: (progress: StudySupportProgress) => void;
}

type StudySupportStreamer = typeof streamStudySupport;

/**
 * Student Assistant questions use the course-grounded Study Support contract.
 * Workflow remains a separate instructor-only transport because it can return
 * approval actions that must never be offered by the student experience.
 */
export class StudentStudySupportApiService {
  constructor(private readonly stream: StudySupportStreamer = streamStudySupport) {}

  async chat({
    courseId,
    message,
    accessToken,
    timeZone,
    onProgress = () => undefined,
  }: StudentStudySupportChatRequest): Promise<string> {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      throw new Error('Select a course before asking Coursistant.');
    }

    const responseBody = await this.stream({
      url: studySupportEndpoint('/query/stream'),
      body: buildStudySupportStreamBody({
        courseId,
        query: message,
        dialogueId: -1,
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Timezone': timeZone,
      },
      onProgress,
    });

    return readStudySupportAnswer(responseBody);
  }
}

export const studentStudySupportApiService = new StudentStudySupportApiService();
