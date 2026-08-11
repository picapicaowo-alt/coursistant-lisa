import {DEFAULT_WIDGET_INSTANCES, SCREEN_BREAKPOINTS, WIDGET_CONFIGS} from '../constants';
import {GridConstraints, GridLayoutItem, LayoutOptions, OccupiedSpace, ScreenSizeInfo} from "@/pages/LmsHomePage/types";

export const getScreenSize = (width: number): ScreenSizeInfo => {
  if (width >= SCREEN_BREAKPOINTS.LARGE) {
    return {isLarge: true, isMedium: false, isSmall: false, size: 'large'};
  }
  if (width >= SCREEN_BREAKPOINTS.MEDIUM) {
    return {isLarge: false, isMedium: true, isSmall: false, size: 'medium'};
  }
  return {isLarge: false, isMedium: false, isSmall: true, size: 'small'};
};

export const getColumns = (width: number): number => {
  if (width >= SCREEN_BREAKPOINTS.LARGE) return 12;
  if (width >= SCREEN_BREAKPOINTS.MEDIUM) return 8;
  return 4;
};

export const getWidgetLayoutInfo = (
  widgetId: string,
  screenSize: ScreenSizeInfo,
  columns: number
): { w: number; h: number; x?: number; y?: number; constraints?: GridConstraints } => {
  const config = WIDGET_CONFIGS[widgetId as keyof typeof WIDGET_CONFIGS];
  if (!config) return {w: 2, h: 2};
  
  let size: { w: number; h: number };
  
  if (screenSize.isSmall && config.small) {
    size = config.small;
  } else if (screenSize.isMedium && config.medium) {
    size = config.medium;
  } else if (screenSize.isLarge && config.large) {
    size = config.large;
  } else {
    size = config.default;
  }
  
  return {
    w: Math.min(size.w, columns),
    h: size.h,
    x: config.defaultPosition?.x,
    y: config.defaultPosition?.y,
    constraints: config.constraints,
  };
};

/**
 * Builds the default arrangement for a set of widgets.
 *
 * Placement is sequential: each widget claims its configured slot if that slot
 * is still free, and otherwise falls into the first gap that fits. Copies of
 * an existing widget therefore land beside the original rather than on top of
 * it, since the original has already taken the configured slot.
 */
export const calculateLayout = ({
                                  screenSize,
                                  containerWidth,
                                  instances = DEFAULT_WIDGET_INSTANCES,
                                }: LayoutOptions): GridLayoutItem[] => {
  const columns = getColumns(containerWidth);
  const layout: GridLayoutItem[] = [];
  const occupiedSpaces: OccupiedSpace[] = [];

  if (screenSize.isSmall) {
    let currentY = 0;

    instances.forEach(({id, type}) => {
      const layoutInfo = getWidgetLayoutInfo(type, screenSize, columns);

      layout.push({
        i: id,
        x: 0,
        y: currentY,
        w: columns,
        h: layoutInfo.h,
        ...layoutInfo.constraints
      });

      currentY += layoutInfo.h;
    });

    return layout;
  }

  instances.forEach(({id, type}) => {
    const layoutInfo = getWidgetLayoutInfo(type, screenSize, columns);
    let x = 0;
    let y = 0;

    if (layoutInfo.x !== undefined && layoutInfo.y !== undefined) {
      if (isPositionAvailable(layoutInfo.x, layoutInfo.y, layoutInfo.w, layoutInfo.h, occupiedSpaces, columns)) {
        x = layoutInfo.x;
        y = layoutInfo.y;
      }
    }

    if (x === 0 && y === 0) {
      const position = findFirstAvailablePosition(layoutInfo.w, layoutInfo.h, occupiedSpaces, columns);
      x = position.x;
      y = position.y;
    }

    const optimizedPosition = optimizePosition(x, y, layoutInfo.w, layoutInfo.h, occupiedSpaces);
    x = optimizedPosition.x;
    y = optimizedPosition.y;

    layout.push({
      i: id,
      x,
      y,
      w: layoutInfo.w,
      h: layoutInfo.h,
      ...layoutInfo.constraints,
    });

    occupiedSpaces.push({
      x,
      y,
      w: layoutInfo.w,
      h: layoutInfo.h,
      right: x + layoutInfo.w,
      bottom: y + layoutInfo.h,
    });
  });

  return layout;
};

function isPositionAvailable(
  x: number,
  y: number,
  w: number,
  h: number,
  occupiedSpaces: OccupiedSpace[],
  columns: number
): boolean {
  if (x < 0 || x + w > columns) return false;
  
  for (const occupied of occupiedSpaces) {
    if (
      x < occupied.right &&
      x + w > occupied.x &&
      y < occupied.bottom &&
      y + h > occupied.y
    ) {
      return false;
    }
  }
  
  return true;
}

function findFirstAvailablePosition(
  w: number,
  h: number,
  occupiedSpaces: OccupiedSpace[],
  columns: number
): { x: number; y: number } {
  const maxY = occupiedSpaces.length > 0
    ? Math.max(...occupiedSpaces.map(s => s.bottom))
    : 0;
  
  const gridHeight = maxY + h + 1;
  const grid: boolean[][] = Array(gridHeight).fill(null).map(() => Array(columns).fill(false));
  
  occupiedSpaces.forEach(space => {
    for (let i = space.x; i < space.right; i++) {
      for (let j = space.y; j < space.bottom; j++) {
        if (j < gridHeight) grid[j][i] = true;
      }
    }
  });
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x <= columns - w; x++) {
      let available = true;
      for (let dx = 0; dx < w && available; dx++) {
        for (let dy = 0; dy < h && available; dy++) {
          if (y + dy >= gridHeight || grid[y + dy][x + dx]) {
            available = false;
          }
        }
      }
      
      if (available) {
        return {x, y};
      }
    }
  }
  
  return {x: 0, y: maxY};
}

function optimizePosition(
  x: number,
  y: number,
  w: number,
  h: number,
  occupiedSpaces: OccupiedSpace[]
): { x: number; y: number } {
  let optimizedX = x;
  let optimizedY = y;
  
  for (let testY = y - 1; testY >= 0; testY--) {
    let canMove = true;
    for (const occupied of occupiedSpaces) {
      if (
        x < occupied.right &&
        x + w > occupied.x &&
        testY < occupied.bottom &&
        testY + h > occupied.y
      ) {
        canMove = false;
        break;
      }
    }
    if (canMove) {
      optimizedY = testY;
    } else {
      break;
    }
  }
  
  for (let testX = x - 1; testX >= 0; testX--) {
    let canMove = true;
    for (const occupied of occupiedSpaces) {
      if (
        testX < occupied.right &&
        testX + w > occupied.x &&
        optimizedY < occupied.bottom &&
        optimizedY + h > occupied.y
      ) {
        canMove = false;
        break;
      }
    }
    if (canMove) {
      optimizedX = testX;
    } else {
      break;
    }
  }
  
  return {x: optimizedX, y: optimizedY};
}