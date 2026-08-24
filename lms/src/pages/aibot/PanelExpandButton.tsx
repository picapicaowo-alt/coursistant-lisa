import {Maximize2, Minimize2} from 'lucide-react';
import styles from './index.module.scss';

interface PanelExpandButtonProps {
  isExpanded: boolean;
  panelName: string;
  onToggle: () => void;
}

const PanelExpandButton = ({
  isExpanded,
  panelName,
  onToggle,
}: PanelExpandButtonProps) => {
  const actionLabel = isExpanded ? `Exit ${panelName} full view` : `Expand ${panelName}`;

  return (
    <button
      type="button"
      className={styles.expandButton}
      aria-label={actionLabel}
      title={actionLabel}
      aria-pressed={isExpanded}
      onClick={onToggle}
    >
      {isExpanded ? <Minimize2 aria-hidden="true"/> : <Maximize2 aria-hidden="true"/>}
    </button>
  );
};

export default PanelExpandButton;
