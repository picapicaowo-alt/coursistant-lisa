import React, {Suspense, useState} from "react";
import {useNavigate} from "react-router-dom";
import styles from "./index.module.scss";
import {useTranslation} from "react-i18next";
import {CoursePreview} from "./components/CoursePreview";
import {LoadingOverlay} from "@/components/LoadingOverlay";
import {useSuspenseQuery} from "@tanstack/react-query";
import {courseApiService} from "@/apis/services/course-api";
import {unwrapData} from "@/apis";
import {useRequiredAuth} from "@/contexts/RequiredAuthContext";

const CourseCataloguePage: React.FC = () => {
  const {t} = useTranslation("course");
  const navigate = useNavigate();
  const {user} = useRequiredAuth();
  
  const [activeTab, setActiveTab] = useState("My Course");
  
  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentContainer}>
        <div className={styles.tabsContainer}>
          <div
            className={`${styles.tab} ${activeTab === "My Course" ? styles.active : ""}`}
            onClick={() => setActiveTab("My Course")}
          >
            <span className={styles.tabLabel}>
              {t("list.tabs.myCourses")}
            </span>
          </div>
          
          <div className={styles.tabSpacer}/>
          
          {user?.level !== "STUDENT" && (
            <button
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
          <CoursesList/>
        </Suspense>
      </div>
    </div>
  );
};

const CoursesList: React.FC = () => {
  const {user} = useRequiredAuth();
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = 1;
  
  const {data} = useSuspenseQuery({
    queryKey: ['courses-list', user.id, currentPage],
    queryFn: async () => {
      return unwrapData(await courseApiService.getCourseCatalogues(), 'getCourseCatalogues');
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  return (
    <React.Fragment>
      <div className={styles.courseGrid}>
        {data.map((course, index) => (
          <CoursePreview
            key={`${course.courseCode}-${index}`}
            {...course}
          />
        ))}
      </div>
      
      {data.length > 0 && (
        <div className={styles.paginationContainer}>
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <svg className={styles.arrowIcon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
            </svg>
          </button>
          
          <div className={styles.pageNumbers}>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`${styles.pageButton} ${currentPage === i + 1 ? styles.active : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <svg className={styles.arrowIcon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </button>
        </div>
      )}
    </React.Fragment>
  );
}

export default CourseCataloguePage;