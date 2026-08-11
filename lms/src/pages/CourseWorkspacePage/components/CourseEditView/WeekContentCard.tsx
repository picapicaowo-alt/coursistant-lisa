import React from "react";
import styles from "../CourseDetailView/index.module.scss";
import editStyles from "./index.module.scss";
import {CourseWeek} from "@/apis";

interface WeekContentCardProps {
  courseId: number;
  week: CourseWeek | null;
  onChanged: () => void;
}

/**
 * The Course Content card in edit mode.
 *
 * The design puts a block editor here — a titled document with slash commands
 * and AI actions. A week has no rich-text field to hold one: it holds
 * materials, which are files and links. So this shows the week's materials and
 * says plainly that uploading is not wired up yet, rather than presenting an
 * editor whose contents could never be saved.
 */
export const WeekContentCard: React.FC<WeekContentCardProps> = ({week}) => (
  <section className={styles.card}>
    <p className={styles.cardLabel}>Course Content</p>

    {!week ? (
      <p className={styles.cardEmpty}>Add a week to start putting content in it.</p>
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
              </li>
            ))}
          </ul>
        )}

        <p className={editStyles.notice}>
          Uploading materials isn&apos;t available here yet.
        </p>
      </>
    )}
  </section>
);
