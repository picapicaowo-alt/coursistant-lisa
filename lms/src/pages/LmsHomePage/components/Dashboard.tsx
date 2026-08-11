import React from 'react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import styles from "./Dashboard.module.scss"
import ReactGridLayout, {verticalCompactor} from 'react-grid-layout';
import WidgetWrapper from './WidgetWrapper';
import {GridLayoutItem, WidgetConfig} from "@/pages/LmsHomePage/types";

interface DashboardProps {
  layout: GridLayoutItem[];
  width: number;
  columns: number;
  mounted: boolean;
  widgetConfigs: WidgetConfig[];
  containerRef: React.RefObject<HTMLDivElement>;
  locked: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayoutChange: (layout: GridLayoutItem[]) => void;
}

/**
 * Elements that must keep their own click and drag behaviour.
 *
 * Without this the grid swallows interaction inside widgets: pressing a button
 * or dragging to select text starts moving the widget instead. Scrollable
 * regions are excluded too, since a widget taller than its tile has to be
 * scrollable to be usable.
 */
const DRAG_CANCEL_SELECTOR = 'button, a, input, select, textarea, [role="button"], .xl-no-drag';

export const Dashboard: React.FC<DashboardProps> = ({
                                                      layout,
                                                      width,
                                                      columns,
                                                      mounted,
                                                      widgetConfigs,
                                                      containerRef,
                                                      locked,
                                                      selectedId,
                                                      onSelect,
                                                      onLayoutChange,
                                                    }) => {
  if (!mounted) return null;

  return (
    <div className={styles['grid-layout-container']} ref={containerRef}>
      <ReactGridLayout
        layout={layout}
        width={width}
        gridConfig={{cols: columns, rowHeight: 30}}
        compactor={verticalCompactor}
        // Locking is the only thing that turns these off. Left on, the layout
        // is the user's to rearrange and every change is persisted locally.
        dragConfig={{enabled: !locked, cancel: DRAG_CANCEL_SELECTOR}}
        resizeConfig={{enabled: !locked, handles: ['se']}}
        onLayoutChange={onLayoutChange}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
        }}
      >
        {widgetConfigs.map(({key, type, ref, component}) => (
          <div
            key={key}
            ref={ref}
            onPointerDownCapture={() => onSelect(key)}
            className={[
              type === 'chat' ? styles.chat : styles.assignments,
              selectedId === key ? styles.selected : '',
              locked ? '' : styles.movable,
            ].filter(Boolean).join(' ')}
          >
            <WidgetWrapper>
              {component}
            </WidgetWrapper>
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
};
