export interface FileTypeOption {
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
