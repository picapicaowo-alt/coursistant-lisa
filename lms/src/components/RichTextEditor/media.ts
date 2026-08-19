export type MediaInsertKind = 'image' | 'video' | 'file';

export const MAX_EDITOR_FILE_BYTES = 8 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg']);
const FILE_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'zip',
]);

const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);
const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/ogg']);
const FILE_MIME = new Set([
  ...IMAGE_MIME,
  ...VIDEO_MIME,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
]);

export const SAFE_MEDIA_DATA_MIME = new Set([...IMAGE_MIME, ...VIDEO_MIME]);
export const SAFE_FILE_DATA_MIME = new Set([...FILE_MIME]);

export const MEDIA_INSERT_COPY: Record<MediaInsertKind, {
  title: string;
  accept: string;
  chooseLabel: string;
  chooseHint: string;
  dropLabel: string;
  dropHint: string;
  typeError: string;
}> = {
  image: {
    title: 'Insert image',
    accept: 'image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp',
    chooseLabel: 'Choose files',
    chooseHint: 'Opens a file picker so you can select an image from your computer.',
    dropLabel: 'Drag files here',
    dropHint: 'Drop an image into this box to insert it.',
    typeError: 'Choose a PNG, JPEG, GIF, or WebP image.',
  },
  video: {
    title: 'Insert video',
    accept: 'video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg',
    chooseLabel: 'Choose files',
    chooseHint: 'Opens a file picker so you can select a video from your computer.',
    dropLabel: 'Drag files here',
    dropHint: 'Drop a video into this box to insert it.',
    typeError: 'Choose an MP4, WebM, or OGG video.',
  },
  file: {
    title: 'Insert file',
    accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,image/png,image/jpeg,image/gif,image/webp',
    chooseLabel: 'Choose files',
    chooseHint: 'Opens a file picker so you can select a file from your computer.',
    dropLabel: 'Drag files here',
    dropHint: 'Drop a file into this box to insert a download link.',
    typeError: 'Choose a PDF, Office document, ZIP, or image.',
  },
};

export const extensionOf = (filename: string) => {
  const dot = filename.lastIndexOf('.');
  if (dot < 0 || dot === filename.length - 1) return '';
  return filename.slice(dot + 1).toLowerCase();
};

const mimeForKind = (kind: MediaInsertKind) => {
  if (kind === 'image') return IMAGE_MIME;
  if (kind === 'video') return VIDEO_MIME;
  return FILE_MIME;
};

const extensionForKind = (kind: MediaInsertKind) => {
  if (kind === 'image') return IMAGE_EXTENSIONS;
  if (kind === 'video') return VIDEO_EXTENSIONS;
  return FILE_EXTENSIONS;
};

const inferredMime = (file: File, kind: MediaInsertKind): string | null => {
  const type = file.type.toLowerCase();
  if (mimeForKind(kind).has(type)) return type === 'image/jpg' ? 'image/jpeg' : type;
  const extension = extensionOf(file.name);
  if (!extensionForKind(kind).has(extension)) return null;
  if (IMAGE_EXTENSIONS.has(extension)) return extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
  if (VIDEO_EXTENSIONS.has(extension)) return `video/${extension}`;
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'zip') return 'application/zip';
  if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (extension === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (extension === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (extension === 'doc') return 'application/msword';
  if (extension === 'ppt') return 'application/vnd.ms-powerpoint';
  if (extension === 'xls') return 'application/vnd.ms-excel';
  return null;
};

export const validateEditorFile = (file: File, kind: MediaInsertKind): string | null => {
  if (file.size > MAX_EDITOR_FILE_BYTES) {
    return 'Choose a file smaller than 8 MB.';
  }
  return inferredMime(file, kind) ? null : MEDIA_INSERT_COPY[kind].typeError;
};

export const mimeForEditorFile = (file: File, kind: MediaInsertKind): string | null => inferredMime(file, kind);

export const isSafeDataUrl = (value: string, mediaOnly = false): boolean => {
  if (!value.startsWith('data:')) return false;
  const comma = value.indexOf(',');
  if (comma < 0) return false;
  const header = value.slice(5, comma);
  const [mime, ...params] = header.split(';');
  if (!params.includes('base64')) return false;
  const allowed = mediaOnly ? SAFE_MEDIA_DATA_MIME : SAFE_FILE_DATA_MIME;
  return allowed.has(mime.trim().toLowerCase());
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
};

export const fileToDataUrl = async (file: File, mime: string): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return `data:${mime};base64,${bytesToBase64(bytes)}`;
};
