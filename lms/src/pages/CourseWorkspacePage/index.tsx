import React, {Suspense} from 'react';
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
  const {workspaceMode} = useCourseWorkspaceStore();
  return (
    <div className={styles.container}>
      {workspaceMode !== "detailWorkspace" && <PageHeader/>}
      <PageBody/>
    </div>
  );
}

export default CourseWorkspacePage;