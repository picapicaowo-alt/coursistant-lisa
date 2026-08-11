import React from "react";
import styles from "./index.module.scss";
import {CourseWeek} from "@/apis";

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
                  {material.materialType === 'LINK' ? '🔗' : (material.extension ?? 'file').toUpperCase()}
                </span>
                <span className={styles.materialName}>{material.displayName}</span>
                {material.materialType === 'FILE' && material.sizeBytes !== null && (
                  <span className={styles.materialMeta}>{formatSize(material.sizeBytes)}</span>
                )}
                {/* downloadUrl is a same-origin API path and needs the bearer
                    token, so it is not a plain anchor — wiring the authorised
                    fetch is a separate piece of work. */}
              </li>
            ))}
          </ul>
        )}
      </>
    )}
  </section>
);
