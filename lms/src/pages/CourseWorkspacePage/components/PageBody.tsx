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

export const PageBody: React.FC = () => {
  const {workspaceMode, closeDetailWorkspace, detailWorkspaceProps} = useCourseWorkspaceStore();
  
  const hideSidebar = useMemo(() => workspaceMode === "detailWorkspace", [workspaceMode]);
  
  const [activeUnitId, setActiveUnitId] = React.useState<number | null>(null);
  
  return (
    <div className={`${styles.contentArea} ${hideSidebar ? styles.withHiddenSidebar : ''}`}>
      {/* View mode is its own screen: the design shows the week outline beside
          a stack of content cards, not a panel that swaps with the outline.
          Edit mode keeps the existing two-panel arrangement. */}
      {workspaceMode === "view" && !hideSidebar && <CourseDetailView/>}

      {workspaceMode !== "view" && (
        <div className={`${styles.sidebar} ${hideSidebar ? styles.hidden : ''}`}>
          <CourseUnitsManager activeUnitId={activeUnitId} setActiveUnitId={setActiveUnitId}/>
        </div>
      )}

      <div className={styles.rightColumn}>
        <div className={`${styles.panelContainer} ${hideSidebar ? styles.withHiddenSidebar : ''}`}>
          {workspaceMode !== "view" && (
            <div className={`${styles.panel} ${hideSidebar ? styles.hidden : styles.visible}`}>
              {
                activeUnitId === null ?
                  <CourseInfoPanel/> :
                  <CourseUnitPanel activeUnitId={activeUnitId}/>
              }
            </div>
          )}

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