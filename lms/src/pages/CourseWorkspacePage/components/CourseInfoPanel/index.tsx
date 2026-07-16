import React from "react";
import {Editor} from "./Editor";
import {Display} from "./Display";
import {useCourseWorkspaceStore} from "../../stores/useCourseWorkspaceStore";

export const CourseInfoPanel: React.FC = () => {
  const {workspaceMode} = useCourseWorkspaceStore();
  
  return (workspaceMode === "edit" || workspaceMode === "create" ? <Editor/> : <Display/>)
}