import React, {Suspense, useMemo} from "react";
import styles from "./PageBody.module.scss";
import {ChevronLeft} from "lucide-react";
import {LoadingOverlay} from "@/components/LoadingOverlay";
import {CourseUnitsManager} from "./CourseUnitsManager";
import {CourseInfoPanel} from "./CourseInfoPanel";
import {CourseUnitPanel} from "./CourseUnitPanel";
import {useCourseWorkspaceStore} from "../stores/useCourseWorkspaceStore";
import {DetailWorkspacePage} from "@/pages/DetailWorkspacePage";
import {CourseDetailView} from "./CourseDetailView";
import {CourseEditView} from "./CourseEditView";

export const PageBody: React.FC = () => {
  const {workspaceMode, closeDetailWorkspace, detailWorkspaceProps} = useCourseWorkspaceStore();
  
  const hideSidebar = useMemo(() => workspaceMode === "detailWorkspace", [workspaceMode]);
  
  const [activeUnitId, setActiveUnitId] = React.useState<number | null>(null);
  
  // View and edit are different screens, not two states of one. Rendering the
  // edit shell underneath view mode is what left an empty white panel down the
  // right-hand side of the detail page.
  if (workspaceMode === "view") {
    return (
      <div className={styles.contentArea}>
        <CourseDetailView/>
      </div>
    );
  }

  if (workspaceMode === "edit") {
    return (
      <div className={styles.contentArea}>
        <CourseEditView/>
      </div>
    );
  }

  return (
    <div className={`${styles.contentArea} ${hideSidebar ? styles.withHiddenSidebar : ''}`}>
      <div className={`${styles.sidebar} ${hideSidebar ? styles.hidden : ''}`}>
        <CourseUnitsManager activeUnitId={activeUnitId} setActiveUnitId={setActiveUnitId}/>
      </div>

      <div className={styles.rightColumn}>
        <div className={`${styles.panelContainer} ${hideSidebar ? styles.withHiddenSidebar : ''}`}>
          <div className={`${styles.panel} ${hideSidebar ? styles.hidden : styles.visible}`}>
            {
              activeUnitId === null ?
                <CourseInfoPanel/> :
                <CourseUnitPanel activeUnitId={activeUnitId}/>
            }
          </div>

          <div className={`${styles.panel} ${hideSidebar ? styles.visible : styles.hidden}`}>
            <div className={styles.detailWorkspace}>
              <div className={styles.workspaceHeader}>
                <ChevronLeft
                  size={"2rem"}
                  color={"gray"}
                  onClick={() => closeDetailWorkspace()}
                />
              </div>
              <Suspense fallback={<LoadingOverlay/>}>
                <div className={styles.workspaceContent}>
                  {workspaceMode === "detailWorkspace" && detailWorkspaceProps !== null &&
                    <DetailWorkspacePage {...detailWorkspaceProps}/>
                  }
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};