import React, {Suspense, useState} from "react";
import {useNavigate} from "react-router-dom";
import styles from "./index.module.scss";
import {useTranslation} from "react-i18next";
import {CoursePreview} from "./components/CoursePreview";
import {LoadingOverlay} from "@/components/LoadingOverlay";
import {useSuspenseQuery} from "@tanstack/react-query";
import {dashboardApiService} from "@/apis/services/dashboard-api";
import {CourseState, unwrapData} from "@/apis";
import {useRequiredAuth} from "@/contexts/RequiredAuthContext";
import {courseApiService} from "@/apis/services/course-api";
import {ChevronLeft, ChevronRight} from 'lucide-react';

const CourseCataloguePage: React.FC = () => {
  const {t} = useTranslation("course");
  const navigate = useNavigate();
  const {user} = useRequiredAuth();
  const isUserAccount = user.role === 'USER';
  
  const [courseState, setCourseState] = useState<CourseState>('Active');
  
  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentContainer}>
        <header className={styles.pageHeader}>
          <h1>{isUserAccount ? t("list.tabs.myCourses") : 'Courses'}</h1>
          <p>Open active courses or review archived courses.</p>
        </header>
        <div className={styles.tabsContainer}>
          <button
            type="button"
            className={`${styles.tab} ${courseState === 'Active' ? styles.active : ""}`}
            onClick={() => setCourseState('Active')}
            aria-pressed={courseState === 'Active'}
          >
            <span className={styles.tabLabel}>
              {isUserAccount ? t("list.tabs.myCourses") : 'Courses'}
            </span>
          </button>
          <button
            type="button"
            className={`${styles.tab} ${courseState === 'Archived' ? styles.active : ""}`}
            onClick={() => setCourseState('Archived')}
            aria-pressed={courseState === 'Archived'}
          >
            <span className={styles.tabLabel}>Archived</span>
          </button>
          
          <div className={styles.tabSpacer}/>
          
          {user?.level !== "STUDENT" && (
            <button
              type="button"
              className={styles.addButton}
              onClick={() => navigate("/course/add-content")}
            >
              <span className={styles.addIcon}>+</span>
              <span className={styles.addText}>
                {t("list.newContent")}
              </span>
            </button>
          )}
        </div>
        
        <Suspense fallback={<LoadingOverlay/>}>
          <CoursesList key={courseState} state={courseState}/>
        </Suspense>
      </div>
    </div>
  );
};

const PAGE_SIZE = 20;

const CoursesList: React.FC<{state: CourseState}> = ({state}) => {
  const {t} = useTranslation("course");
  const {user} = useRequiredAuth();
  const isUserAccount = user.role === 'USER';
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * The user's own courses.
   *
   * Not `GET /v2/courses`: that is the tenant-wide browse listing, it answers
   * 403 ACCESS_DENIED for any plain Student or TA, and it returns a page
   * object rather than the array this page used to assume. `/v2/me/courses`
   * is the endpoint every USER account can call for their own enrolments.
   */
  const {data} = useSuspenseQuery({
    queryKey: [isUserAccount ? 'my-courses' : 'admin-courses', user.id, state, currentPage],
    queryFn: async () => {
      const params = {
        state,
        page: currentPage - 1,
        size: PAGE_SIZE,
      } as const;
      if (isUserAccount) {
        const response = await dashboardApiService.getMyCourses(params);
        return unwrapData(response, 'getMyCourses');
      }
      const response = await courseApiService.browseCourses(params);
      return unwrapData(response, 'browseCourses');
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const courses = data.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data.total ?? 0) / (data.size || PAGE_SIZE)));

  // IA-06 asks every list for a designed empty state. This one is reachable:
  // a student with no active enrolments lands here straight after signing up.
  if (courses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>{t("list.noCourses")}</p>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className={styles.courseGrid}>
        {courses.map((course) => (
          <CoursePreview
            key={course.id}
            id={course.id}
            courseCode={course.courseCode}
            title={course.title}
            state={state}
            instructorName={course.primaryInstructor?.name ?? null}
            // Archiving is a Course Manager action. A TA never qualifies, no
            // matter which permission flags it holds, so this checks the
            // enrolment role rather than any of them.
            canManage={!isUserAccount || ('courseRole' in course && (course.courseRole ?? course.role) === 'Instructor')}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <button
            type="button"
            className={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            aria-label="Previous course page"
          >
            <ChevronLeft aria-hidden="true"/>
          </button>
          
          <div className={styles.pageNumbers}>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.pageButton} ${currentPage === i + 1 ? styles.active : ""}`}
                onClick={() => setCurrentPage(i + 1)}
                aria-label={`Course page ${i + 1}`}
                aria-current={currentPage === i + 1 ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <button
            type="button"
            className={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next course page"
          >
            <ChevronRight aria-hidden="true"/>
          </button>
        </div>
      )}
    </React.Fragment>
  );
}

export default CourseCataloguePage;
