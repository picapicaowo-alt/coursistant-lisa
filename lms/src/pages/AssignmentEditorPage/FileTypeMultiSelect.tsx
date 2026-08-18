import {ChevronDown} from 'lucide-react';
import styles from './index.module.scss';

interface FileTypeOption {
  extension: string;
  label: string;
  group: string;
}

export const ASSIGNMENT_FILE_TYPE_OPTIONS: FileTypeOption[] = [
  {extension: 'pdf', label: 'PDF document', group: 'Documents'},
  {extension: 'doc', label: 'Word document', group: 'Documents'},
  {extension: 'docx', label: 'Word document', group: 'Documents'},
  {extension: 'odt', label: 'OpenDocument text', group: 'Documents'},
  {extension: 'rtf', label: 'Rich Text Format', group: 'Documents'},
  {extension: 'txt', label: 'Plain text', group: 'Documents'},
  {extension: 'md', label: 'Markdown', group: 'Documents'},
  {extension: 'xls', label: 'Excel workbook', group: 'Spreadsheets'},
  {extension: 'xlsx', label: 'Excel workbook', group: 'Spreadsheets'},
  {extension: 'csv', label: 'Comma-separated values', group: 'Spreadsheets'},
  {extension: 'ppt', label: 'PowerPoint presentation', group: 'Presentations'},
  {extension: 'pptx', label: 'PowerPoint presentation', group: 'Presentations'},
  {extension: 'png', label: 'PNG image', group: 'Images'},
  {extension: 'jpg', label: 'JPEG image', group: 'Images'},
  {extension: 'jpeg', label: 'JPEG image', group: 'Images'},
  {extension: 'gif', label: 'GIF image', group: 'Images'},
  {extension: 'webp', label: 'WebP image', group: 'Images'},
  {extension: 'zip', label: 'ZIP archive', group: 'Archives'},
  {extension: 'json', label: 'JSON data', group: 'Data and code'},
  {extension: 'xml', label: 'XML data', group: 'Data and code'},
];

const normalizeExtensions = (extensions: string[]) => Array.from(new Set(
  extensions.map(extension => extension.trim().toLowerCase().replace(/^\./, '')).filter(Boolean),
));

interface FileTypeMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const FileTypeMultiSelect = ({value, onChange}: FileTypeMultiSelectProps) => {
  const normalized = normalizeExtensions(value);
  const knownExtensions = new Set(ASSIGNMENT_FILE_TYPE_OPTIONS.map(option => option.extension));
  const retainedOptions: FileTypeOption[] = normalized
    .filter(extension => !knownExtensions.has(extension))
    .map(extension => ({extension, label: 'Previously configured type', group: 'Other configured types'}));
  const options = [...ASSIGNMENT_FILE_TYPE_OPTIONS, ...retainedOptions];
  const allExtensions = options.map(option => option.extension);
  const selected = new Set(normalized);
  const groups = Array.from(new Set(options.map(option => option.group)));

  const toggle = (extension: string) => {
    const next = new Set(selected);
    if (next.has(extension)) next.delete(extension);
    else next.add(extension);
    onChange(allExtensions.filter(option => next.has(option)));
  };

  const summary = normalized.length === 0
    ? 'Select file types'
    : normalized.length === allExtensions.length
      ? `All ${allExtensions.length} file types`
      : normalized.length <= 4
        ? normalized.map(extension => `.${extension}`).join(', ')
        : `${normalized.length} file types selected`;

  return (
    <fieldset className={`${styles.field} ${styles.fileTypeField}`}>
      <legend>Allowed file types</legend>
      <details className={styles.fileTypeSelect}>
        <summary>
          <span>{summary}</span>
          <ChevronDown size={18} aria-hidden="true"/>
        </summary>
        <div className={styles.fileTypeMenu}>
          <div className={styles.fileTypeActions}>
            <button type="button" onClick={() => onChange(allExtensions)}>Select all</button>
            <button type="button" onClick={() => onChange([])}>Clear</button>
          </div>
          {groups.map(group => (
            <div key={group} className={styles.fileTypeGroup}>
              <p>{group}</p>
              {options.filter(option => option.group === group).map(option => (
                <label key={option.extension}>
                  <input
                    type="checkbox"
                    checked={selected.has(option.extension)}
                    onChange={() => toggle(option.extension)}
                  />
                  <strong>.{option.extension}</strong>
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </details>
      <small className={styles.fileTypeHelp}>Choose one or more types students may submit.</small>
    </fieldset>
  );
};
