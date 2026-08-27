import React, {useMemo, useRef} from 'react';
import {calculateLayout, getColumns, getScreenSize} from '../utils/layoutCalculations';
import {useContainerWidth} from 'react-grid-layout';
import AssignmentComponent from "@/sections/assignments/AssignmentComponent";
import CourseComponent from "../components/CourseComponent.js";
import LearningScheduleComponent from "@/sections/learning_schedule/LearningScheduleComponent";
import PostComponent from "@/sections/posts/PostComponent";
import AverageScoreComponent from '../components/AverageScoreComponent';
import {GridLayoutItem, ScreenSizeInfo, WidgetConfig, WidgetId} from "@/pages/LmsHomePage/types";
import {WIDGET_ORDER} from '@/pages/LmsHomePage/constants';

interface UseWidgetLayoutResult {
  containerRef: React.RefObject<HTMLDivElement>;
  width: number;
  mounted: boolean;
  widgetConfigs: WidgetConfig[];
  layout: GridLayoutItem[];
  columns: number;
  screenSize: ScreenSizeInfo;
}

/**
 * Binds the responsive grid calculation to the currently registered widgets.
 * Component elements and refs stay stable so width-driven layout changes do
 * not remount widgets or discard their local UI state.
 */
export const useWidgetLayout = (): UseWidgetLayoutResult => {
  const assignmentsRef = useRef<HTMLDivElement>(null);
  const courseRef = useRef<HTMLDivElement>(null);
  const learningScheduleRef = useRef<HTMLDivElement>(null);
  const postsRef = useRef<HTMLDivElement>(null);
  const averageScoreRef = useRef<HTMLDivElement>(null);
  
  const widgetComponents = useMemo<Partial<Record<WidgetId, React.ReactNode>>>(() => ({
    assignments: <AssignmentComponent/>,
    course: <CourseComponent/>,
    'learning-schedule': <LearningScheduleComponent/>,
    posts: <PostComponent/>,
    'average-score': <AverageScoreComponent/>,
  }), []);
  
  const widgetRefs = useMemo<Partial<Record<WidgetId, React.RefObject<HTMLDivElement>>>>(() => ({
    assignments: assignmentsRef,
    course: courseRef,
    'learning-schedule': learningScheduleRef,
    posts: postsRef,
    'average-score': averageScoreRef,
  }), []);
  
  const widgetConfigs = useMemo<WidgetConfig[]>(() => {
    return WIDGET_ORDER.flatMap(key => {
      const component = widgetComponents[key];
      if (!component) return [];

      return [{key, component, ref: widgetRefs[key]}];
    });
  }, [widgetComponents, widgetRefs]);
  
  const {width, containerRef, mounted} = useContainerWidth();
  
  const screenSize = useMemo(() => getScreenSize(width), [width]);
  const columns = useMemo(() => getColumns(width), [width]);
  
  const layout = useMemo(() => {
    if (!containerRef.current || !mounted) return [];

    // Layout constants can outlive a removed/feature-gated widget. Filtering at
    // this boundary prevents stale configuration from reserving an empty cell.
    const activeKeys = new Set(widgetConfigs.map(widget => widget.key));
    return calculateLayout({
      screenSize,
      containerWidth: containerRef.current.offsetWidth,
    }).filter(item => activeKeys.has(item.i));
  }, [containerRef, mounted, screenSize, widgetConfigs]);
  
  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    width,
    mounted,
    widgetConfigs,
    layout,
    columns,
    screenSize
  };
};
