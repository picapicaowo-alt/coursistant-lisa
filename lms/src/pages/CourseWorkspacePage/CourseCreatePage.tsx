import React, {Suspense, useEffect} from 'react';
import styles from './index.module.scss';
import {PageHeader} from "./components/PageHeader";
import {PageBody} from "./components/PageBody";
import {LoadingOverlay} from "@/components/LoadingOverlay";
import {useCourseWorkspaceStore} from "./stores/useCourseWorkspaceStore";
import {CourseDetailDTO} from "@/apis";

const DEFAULT_COURSE_DETAIL: CourseDetailDTO = {
  courseInfo: {
    id: -1,
    createdAt: new Date(),
    updatedAt: new Date(),
    courseCode: "",
    name: "",
    description: "",
    school: "",
    semester: "",
    teacherName: "",
    teacherPhone: "",
    teacherEmail: "",
  },
  courseUnits: [],
  assignments: [],
};

const CourseCreatePage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingOverlay/>}>
      <CreateContainer/>
    </Suspense>
  );
};

const CreateContainer: React.FC = () => {
  const {loadCourseInfo, setWorkspaceMode} = useCourseWorkspaceStore();

  useEffect(() => {
    loadCourseInfo(DEFAULT_COURSE_DETAIL);
    setWorkspaceMode("create");
  }, []);

  return (
    <div className={styles.container}>
      <PageHeader/>
      <PageBody/>
    </div>
  );
};

export default CourseCreatePage;
