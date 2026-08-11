import React, {Suspense} from 'react';
import {useParams} from 'react-router-dom';
import styles from './index.module.scss';
import {PageHeader} from "./components/PageHeader";
import {PageBody} from "./components/PageBody";
import {LoadingOverlay} from "@/components/LoadingOverlay";
import {useCourseEdit} from "./hooks/useCourseEdit";
import {useCourseWorkspaceStore} from "./stores/useCourseWorkspaceStore";

const CourseWorkspacePage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingOverlay/>}>
      <Container/>
    </Suspense>
  );
};

const Container: React.FC = () => {
  useCourseEdit();
  const {workspaceMode, setWorkspaceMode} = useCourseWorkspaceStore();
  const {courseId} = useParams();

  // The workspace store is a module singleton, so the mode outlives the page
  // that set it — arriving here after the create screen would otherwise leave
  // the course showing the create layout. Opening a course always starts in
  // view mode.
  React.useEffect(() => {
    setWorkspaceMode("view");
  }, [courseId]);
  return (
    <div className={styles.container}>
      {workspaceMode !== "detailWorkspace" && <PageHeader/>}
      <PageBody/>
    </div>
  );
}

export default CourseWorkspacePage;