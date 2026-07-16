import React from "react";
import {Editor} from "./Editor";

interface CourseUnitPanelProps {
  activeUnitId: number;
}

export const CourseUnitPanel: React.FC<CourseUnitPanelProps> = ({
                                                                  activeUnitId,
                                                                }) => {
  return (<Editor activeUnitId={activeUnitId}/>);
}