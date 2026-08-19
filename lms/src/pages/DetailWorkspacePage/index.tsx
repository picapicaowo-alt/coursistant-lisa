// @ts-nocheck — legacy DetailWorkspace shell; quarantined until v1 assignment UI is removed (PROJECT_STANDARDS.md §13).
import React, {useEffect, useMemo} from "react";
import {useSuspenseQuery} from "@tanstack/react-query";
import {StudentAssignmentConfig} from "./components/AssignmentSubmit/index.config";
import {AssignmentReviewConfig} from "./components/AssignmentReview/index.config";
import {AssignmentEditConfig} from "./components/AssignmentEdit/index.config";
import {
  DetailWorkspaceConfigMap,
  DetailWorkspaceType,
  DetailWorkspaceQueryMap
} from "./types";
import {
  AssignmentBase,
  AssignmentForReview,
  AssignmentForStudent,
} from "@/types";
import {LoadableStore} from "@/types/stores";
import styles from "./index.module.scss";

const detailWorkspaceConfigs: DetailWorkspaceConfigMap = {
  'student-assignment': StudentAssignmentConfig,
  'teacher-assignment-review': AssignmentReviewConfig,
  'teacher-assignment-edit': AssignmentEditConfig,
};

export function DetailWorkspacePage<TType extends DetailWorkspaceType>({
  type,
  query,
}: {
  type: TType;
  query: DetailWorkspaceQueryMap[TType];
}) {
  
  const config = useMemo(() => {
    return  detailWorkspaceConfigs[type];
  }, [type, query]);
  
  if (!config) {
    throw new Error(`No configuration found for workspace type`);
  }
  
  const store = config.store();
  
  const queryKey = useMemo(() =>
      config.queryKey(query),
    [config, query]);
  
  const getQueryFn = useMemo(() =>
      config.queryFn(query),
    [config, query]);
  
  const {data} = useSuspenseQuery({
    queryKey,
    queryFn: getQueryFn,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  useEffect(() => {
    if (data !== null && data !== undefined) {
      switch (config.type) {
        case 'student-assignment':
          (store as LoadableStore<AssignmentForStudent>).loadRoot(data as AssignmentForStudent);
          break;
        case 'teacher-assignment-review':
          (store as LoadableStore<AssignmentForReview>).loadRoot(data as AssignmentForReview);
          break;
        case 'teacher-assignment-edit':
          (store as LoadableStore<AssignmentBase>).loadRoot(data as AssignmentBase);
          break;
      }
    }
  }, [data]);

  useEffect(() => {
    if (data === null && config.type === "teacher-assignment-edit") {
      (store as LoadableStore<any>).loadRoot({
        id: crypto.randomUUID(),
        title: "",
        description: "",
        dueTime: new Date(),
        type: "Homework",
        attachments: [],
        settings: {
          allowLateSubmission: false,
          allowedResubmissionCount: 0,
        },
      });
    }
  }, [data]);
  
  return <div className={styles.container}>
    <config.component/>
  </div>;
}