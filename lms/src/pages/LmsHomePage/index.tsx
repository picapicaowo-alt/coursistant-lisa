import React, {useState} from "react";
import styles from "./index.module.scss"
import AnnouncementManager from "../../sections/Notification/index.jsx";
import {useWidgetLayout} from "@/pages/LmsHomePage/hooks/useWidgetLayout";
import {Dashboard} from "@/pages/LmsHomePage/components/Dashboard";
import WidgetToolbar from "@/pages/LmsHomePage/components/WidgetToolbar";
import AddWidgetModal from "@/pages/LmsHomePage/components/AddWidgetModal";

const LMSHome: React.FC = () => {
  const [selectedChatSection, setSelectedChatSection] = useState('ai');
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);

  const {
    containerRef,
    width,
    mounted,
    widgetConfigs,
    layout,
    columns,
    locked,
    toggleLocked,
    selectedId,
    selectWidget,
    onLayoutChange,
    addWidget,
    duplicateWidget,
    removeWidget,
    resetLayout,
  } = useWidgetLayout();

  return (
    <div className={styles['lms-home-container']}>
      {/* Canvas controls. Upload is in the design too, but it has no endpoint
          and no defined target, so it is not built — see open-decisions S-4. */}
      <div className={styles['canvas-bar']}>
        <WidgetToolbar
          locked={locked}
          onToggleLock={toggleLocked}
          selectedId={selectedId}
          onDuplicate={() => selectedId && duplicateWidget(selectedId)}
          onDelete={() => selectedId && removeWidget(selectedId)}
          onReset={resetLayout}
        />

        <button
          type="button"
          className={styles['add-widget']}
          onClick={() => setAddWidgetOpen(true)}
        >
          <span aria-hidden="true">+</span> Add Widget
        </button>
      </div>

      <Dashboard
        layout={layout}
        width={width}
        columns={columns}
        mounted={mounted}
        widgetConfigs={widgetConfigs}
        containerRef={containerRef}
        locked={locked}
        selectedId={selectedId}
        onSelect={selectWidget}
        onLayoutChange={onLayoutChange}
      />

      <AddWidgetModal
        open={addWidgetOpen}
        onClose={() => setAddWidgetOpen(false)}
        onCreate={addWidget}
      />

      <AnnouncementManager
        selectedChatSection={selectedChatSection}
        setSelectedChatSection={setSelectedChatSection}
      />
    </div>
  );
};

export default LMSHome;
