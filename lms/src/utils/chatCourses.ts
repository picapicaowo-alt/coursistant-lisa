import type {MyCourse} from '@/apis';
import {unwrapData} from '@/apis';
import {dashboardApiService} from '@/apis/services/dashboard-api';

const CHAT_COURSE_PAGE_SIZE = 100;

/**
 * Loads every active enrolment used by the AI course selector and lockdown.
 * The retired `/course/selectByUserId` endpoint returns 500 on the v2 dev
 * backend, while `/v2/me/courses` is the authenticated source of truth.
 */
export const loadActiveChatCourses = async (): Promise<MyCourse[]> => {
  const courses: MyCourse[] = [];
  let page = 0;

  while (true) {
    const response = await dashboardApiService.getMyCourses({
      state: 'Active',
      page,
      size: CHAT_COURSE_PAGE_SIZE,
    });
    const result = unwrapData(response, `getMyCourses for AI course selector (page ${page})`);
    courses.push(...result.items);

    const nextPage = result.page + 1;
    if (courses.length >= result.total || result.items.length === 0 || nextPage <= page) {
      return courses;
    }
    page = nextPage;
  }
};
