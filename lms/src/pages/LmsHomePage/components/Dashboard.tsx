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
}

export const Dashboard: React.FC<DashboardProps> = ({
                                                      layout,
                                                      width,
                                                      columns,
                                                      mounted,
                                                      widgetConfigs,
                                                      containerRef,
                                                    }) => {
  if (!mounted) return null;
  
  return (
    <div className={styles['grid-layout-container']} ref={containerRef}>
      <ReactGridLayout
        layout={layout}
        width={width}
        gridConfig={{cols: columns, rowHeight: 30}}
        compactor={verticalCompactor}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
        }}
      >
        {widgetConfigs.map(({key, ref, component}) => (
          <div key={key} className={key === 'chat' ? styles.chat : styles.assignments} ref={ref}>
            <WidgetWrapper>
              {component}
            </WidgetWrapper>
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
};