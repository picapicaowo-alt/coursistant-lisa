import React, {useState} from "react";
import {Download, ExternalLink, Eye} from 'lucide-react';
import styles from "./index.module.scss";
import {CourseMaterial, CourseWeek} from "@/apis";
import {courseApiService} from '@/apis/services/course-api';

const formatSize = (bytes: number | null): string => {
  if (bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * The Course Content card — the selected week and what is in it.
 *
 * The design shows a paragraph of description under the title. A week has no
 * description field; it holds materials. So the card lists those instead of
 * leaving the space blank or padding it with text the course never wrote.
 */
export const ContentCard: React.FC<{week: CourseWeek | null}> = ({week}) => (
  <ContentCardBody week={week}/>
);

const ContentCardBody: React.FC<{week: CourseWeek | null}> = ({week}) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = async (material: CourseMaterial) => {
    if (!week) return;
    setActiveAction(`download-${material.id}`);
    setError(null);

    try {
      const blob = await courseApiService.downloadMaterial(week.courseId, week.id, material.id);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = material.originalFilename || material.displayName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      setError(`Could not download ${material.displayName}.`);
    } finally {
      setActiveAction(null);
    }
  };

  const preview = async (material: CourseMaterial) => {
    if (!week) return;
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      setError('Allow pop-ups to preview this file.');
      return;
    }
    previewWindow.opener = null;
    previewWindow.document.title = 'Loading preview…';
    setActiveAction(`preview-${material.id}`);
    setError(null);

    try {
      const blob = await courseApiService.previewMaterial(week.courseId, week.id, material.id);
      const objectUrl = URL.createObjectURL(blob);
      previewWindow.location.replace(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      previewWindow.close();
      setError(`Could not preview ${material.displayName}.`);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <section className={styles.card}>
      <p className={styles.cardLabel}>Course Content</p>

      {!week ? (
        <p className={styles.cardEmpty}>Select a week to see its content.</p>
      ) : (
        <>
          <h2 className={styles.contentTitle}>{week.title}</h2>

          {week.materials.length === 0 ? (
            <p className={styles.cardEmpty}>No materials in this week yet.</p>
          ) : (
            <ul className={styles.materialList}>
              {week.materials.map((material) => (
                <li key={material.id} className={styles.material}>
                  <span className={styles.materialIcon} aria-hidden="true">
                    {material.materialType === 'LINK' ? 'LINK' : (material.extension ?? 'file').toUpperCase()}
                  </span>
                  <span className={styles.materialName}>{material.displayName}</span>
                  {material.materialType === 'FILE' && material.sizeBytes !== null ? (
                    <span className={styles.materialMeta}>{formatSize(material.sizeBytes)}</span>
                  ) : null}
                  <span className={styles.materialActions}>
                    {material.materialType === 'LINK' && material.linkUrl ? (
                      <a href={material.linkUrl} target="_blank" rel="noreferrer">
                        <ExternalLink size={15}/> Open
                      </a>
                    ) : null}
                    {material.materialType === 'FILE' && material.previewAvailable ? (
                      <button
                        type="button"
                        onClick={() => void preview(material)}
                        disabled={activeAction !== null}
                        aria-label={`Preview ${material.displayName}`}
                      >
                        <Eye size={15}/>
                        {activeAction === `preview-${material.id}` ? 'Opening…' : 'Preview'}
                      </button>
                    ) : null}
                    {material.materialType === 'FILE' ? (
                      <button
                        type="button"
                        onClick={() => void download(material)}
                        disabled={activeAction !== null}
                        aria-label={`Download ${material.displayName}`}
                      >
                        <Download size={15}/>
                        {activeAction === `download-${material.id}` ? 'Downloading…' : 'Download'}
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {error ? <p className={styles.materialError} role="alert">{error}</p> : null}
        </>
      )}
    </section>
  );
};
