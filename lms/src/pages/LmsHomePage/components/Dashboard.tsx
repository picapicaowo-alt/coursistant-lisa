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

  if (columns <= 4) {
    return (
      <section className={styles.mobileDashboard} ref={containerRef} aria-label="Dashboard widgets">
        {widgetConfigs.map(({key, ref, component}) => (
          <div key={key} className={`${styles.mobileWidget} ${key === 'chat' ? styles.chat : styles.assignments}`} ref={ref}>
            <WidgetWrapper>{component}</WidgetWrapper>
          </div>
        ))}
      </section>
    );
  }
  
  return (
    <section className={styles['grid-layout-container']} ref={containerRef} aria-label="Dashboard widgets">
      <ReactGridLayout
        layout={layout}
        width={width}
        gridConfig={{cols: columns, rowHeight: 30}}
        compactor={verticalCompactor}
        dragConfig={{enabled: false}}
        resizeConfig={{enabled: false}}
        autoSize
        style={{
          width: '100%',
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
    </section>
  );
};
