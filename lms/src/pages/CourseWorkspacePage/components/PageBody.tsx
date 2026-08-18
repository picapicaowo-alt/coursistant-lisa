import React, {Suspense, useMemo} from "react";
import {useParams} from "react-router-dom";
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

interface PageBodyProps {
  canEditCourse?: boolean;
  canCreateAssignments?: boolean;
  canManageMaterials?: boolean;
  canManageEvents?: boolean;
  canManageGroups?: boolean;
  canPostAnnouncements?: boolean;
}

export const PageBody: React.FC<PageBodyProps> = ({
  canEditCourse = false,
  canCreateAssignments = false,
  canManageMaterials = false,
  canManageEvents = false,
  canManageGroups = false,
  canPostAnnouncements = false,
}) => {
  const {courseId} = useParams();
  const {workspaceMode, closeDetailWorkspace, detailWorkspaceProps} = useCourseWorkspaceStore();
  
  const hideSidebar = useMemo(() => workspaceMode === "detailWorkspace", [workspaceMode]);
  
  const [activeUnitId, setActiveUnitId] = React.useState<number | null>(null);
  
  // The create screen shares this component but has no course in its path,
  // and it only switches the store out of "view" in an effect — so on its
  // first render the mode still says "view". Keying off the route as well
  // stops that frame from asking for a course that does not exist.
  const isCourseRoute = Boolean(courseId);

  // View and edit are different screens, not two states of one. Rendering the
  // edit shell underneath view mode is what left an empty white panel down the
  // right-hand side of the detail page.
  const canOpenEditor = canEditCourse || canManageMaterials;

  if (isCourseRoute && (workspaceMode === "view" || (workspaceMode === "edit" && !canOpenEditor))) {
    return (
      <div className={styles.contentArea}>
        <CourseDetailView canCreateAssignments={canCreateAssignments} canManageEvents={canManageEvents} canManageGroups={canManageGroups} canPostAnnouncements={canPostAnnouncements}/>
      </div>
    );
  }

  if (isCourseRoute && workspaceMode === "edit" && canOpenEditor) {
    return (
      <div className={styles.contentArea}>
        <CourseEditView
          canEditStructure={canEditCourse}
          canUploadMaterials={canManageMaterials}
          canManageEvents={canManageEvents}
        />
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
