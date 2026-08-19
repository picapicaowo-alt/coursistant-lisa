import React from 'react';
import {createPortal} from 'react-dom';
import {FolderOpen, Upload, X} from 'lucide-react';
import styles from './MediaInsertDialog.module.scss';
import {
  fileToDataUrl,
  insertKindFromMime,
  MEDIA_INSERT_COPY,
  mimeForEditorFile,
  type MediaInsertKind,
  validateEditorFile,
} from './media';
import {normalizeSafeUrl} from './url';

export interface MediaInsertPayload {
  url: string;
  name: string;
  kind: MediaInsertKind;
}

interface MediaInsertDialogProps {
  onClose: () => void;
  onInsert: (payload: MediaInsertPayload) => void;
}

const MediaInsertDialog: React.FC<MediaInsertDialogProps> = ({onClose, onInsert}) => {
  const copy = MEDIA_INSERT_COPY;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const chooseRef = React.useRef<HTMLButtonElement>(null);
  const busyRef = React.useRef(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  busyRef.current = busy;

  React.useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    chooseRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const openPicker = () => {
    if (busy) return;
    fileInputRef.current?.click();
  };

  const applyFile = async (file: File | undefined) => {
    if (!file || busy) return;
    const typeError = validateEditorFile(file);
    if (typeError) {
      setError(typeError);
      return;
    }
    const mime = mimeForEditorFile(file);
    if (!mime) {
      setError(copy.typeError);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const kind = insertKindFromMime(mime);
      const dataUrl = await fileToDataUrl(file, mime);
      const url = normalizeSafeUrl(dataUrl, {mediaOnly: kind !== 'file'});
      if (!url) {
        setError(copy.typeError);
        return;
      }
      onInsert({url, name: file.name, kind});
    } catch {
      setError('The file could not be read. Try another file.');
    } finally {
      setBusy(false);
    }
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    void applyFile(file);
  };

  const onDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void applyFile(event.dataTransfer.files?.[0]);
  };

  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={() => { if (!busy) onClose(); }}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-insert-title"
        aria-describedby="media-insert-status"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="media-insert-title" className={styles.title}>{copy.title}</h2>
          <button type="button" className={styles.closeButton} aria-label="Close" onClick={onClose} disabled={busy}>
            <X size={18}/>
          </button>
        </div>

        <div className={styles.zones}>
          <button
            ref={chooseRef}
            type="button"
            className={styles.zone}
            onClick={openPicker}
            disabled={busy}
          >
            <FolderOpen size={28} aria-hidden="true"/>
            <span className={styles.zoneLabel}>{copy.chooseLabel}</span>
            <span className={styles.zoneHint}>{copy.chooseHint}</span>
          </button>

          <button
            type="button"
            className={`${styles.zone} ${isDragging ? styles.zoneDragging : ''}`}
            onClick={openPicker}
            disabled={busy}
            onDragOver={event => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <Upload size={28} aria-hidden="true"/>
            <span className={styles.zoneLabel}>{copy.dropLabel}</span>
            <span className={styles.zoneHint}>{copy.dropHint}</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className={styles.fileInput}
          accept={copy.accept}
          onChange={onPick}
        />

        <p
          id="media-insert-status"
          className={`${styles.status} ${error ? styles.error : ''} ${busy ? styles.busy : ''}`}
          role={error ? 'alert' : 'status'}
        >
          {error ?? (busy ? 'Reading file…' : '')}
        </p>
      </section>
    </div>,
    document.body,
  );
};

export default MediaInsertDialog;
