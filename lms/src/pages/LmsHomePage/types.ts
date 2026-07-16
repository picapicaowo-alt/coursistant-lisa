import React from "react";

export type ScreenSize = 'small' | 'medium' | 'large';

export interface ScreenSizeInfo {
  isLarge: boolean;
  isMedium: boolean;
  isSmall: boolean;
  size: ScreenSize;
}

export interface GridConstraints {
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

export interface WidgetConfig {
  key: string;
  component: React.ReactNode;
  ref?: React.RefObject<HTMLDivElement>;
}

export interface LayoutOptions {
  screenSize: ScreenSizeInfo;
  containerWidth: number;
}

export interface Course {
  id: string;
  instructor: string;
  title: string;
  subtitle: string;
  avatar: string;
}

export type WidgetId = 'chat' | 'course' | 'assignments' | 'learning-schedule' | 'posts' | 'skill-graph';

export interface WidgetLayoutConfig {
  default: { w: number; h: number };
  small?: { w: number; h: number };
  medium?: { w: number; h: number };
  large?: { w: number; h: number };
  constraints?: GridConstraints;
  id: WidgetId;
  defaultPosition?: { x: number; y: number };
}

export interface OccupiedSpace {
  x: number;
  y: number;
  w: number;
  h: number;
  right: number;
  bottom: number;
}