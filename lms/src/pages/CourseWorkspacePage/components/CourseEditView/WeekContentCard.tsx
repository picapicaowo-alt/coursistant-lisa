import React, {useRef, useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FileText,
  FolderInput,
  Link as LinkIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import type {CourseMaterial, CourseWeek} from '@/apis';
import {courseApiService} from '@/apis/services/course-api';
import styles from '../CourseDetailView/index.module.scss';
import editStyles from './index.module.scss';

interface WeekContentCardProps {
  courseId: number;
  week: CourseWeek | null;
  weeks: CourseWeek[];
  currentUserId: number;
  canEditStructure: boolean;
  canUploadMaterials: boolean;
  onChanged: () => void;
}

interface UploadAttempt {
  files: File[];
  idempotencyKey: string;
}

interface LinkAttempt {
  linkUrl: string;
  linkDisplayName?: string;
  idempotencyKey: string;
}

/**
 * Live material management for one week. Instructors can rename, reorder,
 * move and delete every item. A TA with the course content flag can upload and
 * delete only items they uploaded; week structure remains Instructor-only.
 */
export const WeekContentCard: React.FC<WeekContentCardProps> = ({
  courseId,
  week,
  weeks,
  currentUserId,
  canEditStructure,
  canUploadMaterials,
  onChanged,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const finishChange = () => {
    setFailure(null);
    onChanged();
  };

  const uploadMaterials = useMutation({
    mutationFn: ({files, idempotencyKey}: UploadAttempt) => {
      if (!week) throw new Error('Select a week first');
      return courseApiService.createMaterials(courseId, week.id, {files}, idempotencyKey);
    },
    retry: 1,
    onSuccess: finishChange,
    onError: () => setFailure("Couldn't upload the selected file(s)."),
  });

  const addLink = useMutation({
    mutationFn: ({linkUrl: url, linkDisplayName, idempotencyKey}: LinkAttempt) => {
      if (!week) throw new Error('Select a week first');
      return courseApiService.createMaterials(
        courseId,
        week.id,
        {linkUrl: url, linkDisplayName},
        idempotencyKey
      );
    },
    retry: 1,
    onSuccess: () => {
      setLinkUrl('');
      setLinkName('');
      finishChange();
    },
    onError: () => setFailure("Couldn't add the link."),
  });

  const renameMaterial = useMutation({
    mutationFn: ({materialId, displayName}: {materialId: number; displayName: string}) => {
      if (!week) throw new Error('Select a week first');
      return courseApiService.renameMaterial(courseId, week.id, materialId, displayName);
    },
    onSuccess: () => {
      setEditingId(null);
      finishChange();
    },
    onError: () => setFailure("Couldn't rename the material."),
  });

  const deleteMaterial = useMutation({
    mutationFn: (materialId: number) => {
      if (!week) throw new Error('Select a week first');
      return courseApiService.deleteMaterial(courseId, week.id, materialId);
    },
    onSuccess: () => {
      setConfirmDeleteId(null);
      finishChange();
    },
    onError: () => setFailure("Couldn't delete the material."),
  });

  const moveMaterial = useMutation({
    mutationFn: ({materialId, targetWeekId}: {materialId: number; targetWeekId: number}) => {
      if (!week) throw new Error('Select a week first');
      return courseApiService.moveMaterial(courseId, week.id, materialId, targetWeekId);
    },
    onSuccess: finishChange,
    onError: () => setFailure("Couldn't move the material."),
  });

  const reorderMaterials = useMutation({
    mutationFn: (materialIds: number[]) => {
      if (!week) throw new Error('Select a week first');
      return courseApiService.reorderMaterials(courseId, week.id, materialIds);
    },
    onSuccess: finishChange,
    onError: () => setFailure("Couldn't reorder the materials."),
  });

  const publishMaterial = useMutation({
    mutationFn: (materialId: number) => {
      if (!week) throw new Error('Select a week first');
      return courseApiService.publishMaterial(courseId, week.id, materialId);
    },
    onSuccess: finishChange,
    onError: () => setFailure("Couldn't publish the material."),
  });

  const unpublishMaterial = useMutation({
    mutationFn: (materialId: number) => {
      if (!week) throw new Error('Select a week first');
      return courseApiService.unpublishMaterial(courseId, week.id, materialId);
    },
    onSuccess: finishChange,
    onError: () => setFailure("Couldn't unpublish the material."),
  });

  const commitRename = (material: CourseMaterial) => {
    const displayName = editingName.trim();
    if (!displayName || displayName === material.displayName) {
      setEditingId(null);
      return;
    }
    renameMaterial.mutate({materialId: material.id, displayName});
  };

  const moveWithinWeek = (index: number, offset: -1 | 1) => {
    if (!week) return;
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= week.materials.length) return;

    const materialIds = week.materials.map(material => material.id);
    [materialIds[index], materialIds[targetIndex]] = [materialIds[targetIndex], materialIds[index]];
    reorderMaterials.mutate(materialIds);
  };

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.cardLabel}>Course Content</p>
          {week ? <h2 className={styles.cardTitle}>{week.title}</h2> : null}
        </div>
        {week && canUploadMaterials ? (
          <>
            <input
              ref={fileInputRef}
              className={editStyles.visuallyHidden}
              type="file"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) {
                  uploadMaterials.mutate({files, idempotencyKey: crypto.randomUUID()});
                }
                event.target.value = '';
              }}
            />
            <button
              type="button"
              className={editStyles.primaryAction}
              disabled={uploadMaterials.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16}/>
              {uploadMaterials.isPending ? 'Uploading…' : 'Upload files'}
            </button>
          </>
        ) : null}
      </div>

      {!week ? (
        <p className={styles.cardEmpty}>Add or select a week to manage its content.</p>
      ) : (
        <>
          {week.materials.length === 0 ? (
            <div className={editStyles.emptyMaterials}>
              <FileText size={22}/>
              <p>No materials in this week yet.</p>
            </div>
          ) : (
            <ul className={styles.materialList}>
              {week.materials.map((material, index) => {
                const canDelete = canEditStructure
                  || (canUploadMaterials && material.uploadedBy === currentUserId);

                return (
                  <li key={material.id} className={styles.material}>
                    <span className={styles.materialIcon} aria-hidden="true">
                      {material.materialType === 'LINK'
                        ? <LinkIcon size={16}/>
                        : <FileText size={16}/>}
                    </span>

                    {editingId === material.id ? (
                      <input
                        className={`${editStyles.weekInput} ${editStyles.materialNameInput}`}
                        value={editingName}
                        autoFocus
                        onChange={event => setEditingName(event.target.value)}
                        onBlur={() => commitRename(material)}
                        onKeyDown={event => {
                          if (event.key === 'Enter') commitRename(material);
                          if (event.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      <span className={styles.materialName}>
                        {material.displayName}
                        {material.publicationState === 'DRAFT' ? (
                          <span className={editStyles.draftBadge}>Draft</span>
                        ) : material.publicationState === 'PUBLISHED' ? (
                          week.publicationState === 'DRAFT' || material.effectiveStudentVisible === false ? (
                            <span className={editStyles.hiddenBadge} title="Week is in draft; material is not visible to students">Draft Week</span>
                          ) : (
                            <span className={editStyles.publishedBadge}>Published</span>
                          )
                        ) : null}
                      </span>
                    )}

                    <span className={editStyles.materialControls}>
                      {canEditStructure ? (
                        <>
                          {material.publicationState === 'PUBLISHED' ? (
                            <button
                              type="button"
                              disabled={unpublishMaterial.isPending}
                              onClick={() => unpublishMaterial.mutate(material.id)}
                              aria-label={`Unpublish ${material.displayName}`}
                              title="Unpublish material"
                            >
                              <EyeOff size={15}/>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={publishMaterial.isPending}
                              onClick={() => publishMaterial.mutate(material.id)}
                              aria-label={`Publish ${material.displayName}`}
                              title="Publish material"
                            >
                              <Eye size={15}/>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={index === 0 || reorderMaterials.isPending}
                            onClick={() => moveWithinWeek(index, -1)}
                            aria-label={`Move ${material.displayName} up`}
                            title="Move up"
                          >
                            <ArrowUp size={15}/>
                          </button>
                          <button
                            type="button"
                            disabled={index === week.materials.length - 1 || reorderMaterials.isPending}
                            onClick={() => moveWithinWeek(index, 1)}
                            aria-label={`Move ${material.displayName} down`}
                            title="Move down"
                          >
                            <ArrowDown size={15}/>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(material.id);
                              setEditingName(material.displayName);
                            }}
                            aria-label={`Rename ${material.displayName}`}
                            title="Rename"
                          >
                            <Pencil size={15}/>
                          </button>
                          {weeks.length > 1 ? (
                            <label className={editStyles.moveControl} title="Move to another week">
                              <FolderInput size={15}/>
                              <span className={editStyles.visuallyHidden}>Move {material.displayName}</span>
                              <select
                                value=""
                                disabled={moveMaterial.isPending}
                                onChange={event => {
                                  const targetWeekId = Number(event.target.value);
                                  if (targetWeekId) moveMaterial.mutate({materialId: material.id, targetWeekId});
                                }}
                                aria-label={`Move ${material.displayName} to another week`}
                              >
                                <option value="">Move…</option>
                                {weeks.filter(item => item.id !== week.id).map(item => (
                                  <option key={item.id} value={item.id}>{item.title}</option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                        </>
                      ) : null}

                      {canDelete ? (
                        confirmDeleteId === material.id ? (
                          <span className={editStyles.deleteConfirm}>
                            <button
                              type="button"
                              className={editStyles.confirmDelete}
                              disabled={deleteMaterial.isPending}
                              onClick={() => deleteMaterial.mutate(material.id)}
                            >
                              Confirm
                            </button>
                            <button type="button" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={editStyles.deleteIcon}
                            onClick={() => setConfirmDeleteId(material.id)}
                            aria-label={`Delete ${material.displayName}`}
                            title="Delete"
                          >
                            <Trash2 size={15}/>
                          </button>
                        )
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {canUploadMaterials ? (
            <form
              className={editStyles.linkForm}
              onSubmit={event => {
                event.preventDefault();
                const url = linkUrl.trim();
                if (!url) return;
                addLink.mutate({
                  linkUrl: url,
                  linkDisplayName: linkName.trim() || undefined,
                  idempotencyKey: crypto.randomUUID(),
                });
              }}
            >
              <div className={editStyles.linkFormTitle}>
                <Plus size={16}/> Add external link
              </div>
              <input
                type="url"
                required
                placeholder="https://example.com/reading"
                value={linkUrl}
                onChange={event => setLinkUrl(event.target.value)}
                aria-label="Link URL"
              />
              <input
                type="text"
                placeholder="Display name (optional)"
                value={linkName}
                onChange={event => setLinkName(event.target.value)}
                aria-label="Link display name"
              />
              <button type="submit" disabled={!linkUrl.trim() || addLink.isPending}>
                <LinkIcon size={15}/>
                {addLink.isPending ? 'Adding…' : 'Add link'}
              </button>
            </form>
          ) : null}
        </>
      )}

      {failure ? <p className={editStyles.error} role="alert">{failure}</p> : null}
    </section>
  );
};
