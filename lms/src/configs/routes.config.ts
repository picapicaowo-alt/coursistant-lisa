export interface SidebarConfig {
  name: string;
  path: string;
  sidebarItem: {
    filledIcon: string;
    unfilledIcon: string;
    translationLabel: string;
  };
}

export const SIDEBAR_CONFIGS: SidebarConfig[] = [
  {
    name: "Dashboard",
    path: "/",
    sidebarItem: {
      filledIcon: "/icons/home_fill.png",
      unfilledIcon: "/icons/home_unfill.png",
      translationLabel: "sidebar.dashboard",
    },
  },
  {
    name: "My Course",
    path: "/course",
    sidebarItem: {
      filledIcon: "/icons/course_fill.png",
      unfilledIcon: "/icons/course_unfill.png",
      translationLabel: "sidebar.myCourse",
    },
  },
  {
    name: "Chat",
    path: "/chat",
    sidebarItem: {
      filledIcon: "/icons/post_fill.png",
      unfilledIcon: "/icons/chat_unfill.svg",
      translationLabel: "sidebar.chat",
    },
  },
  {
    name: "AI Workplace",
    path: "/aibot",
    sidebarItem: {
      filledIcon: "/icons/ai_course.png",
      unfilledIcon: "/icons/ai_course.png",
      translationLabel: "sidebar.aiWorkplace",
    },
  }
];

export const getSidebarIndex = (pathname: string): number =>
  SIDEBAR_CONFIGS.findIndex(({path}) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(`${path}/`),
  );

export const shouldShowAppShell = (pathname: string): boolean =>
  getSidebarIndex(pathname) >= 0;
