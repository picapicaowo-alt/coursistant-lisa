export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIcon = (type: string) => {
  const lowerType = type.toLowerCase();
  switch (lowerType) {
    case "pdf":
      return "/icons/add-content/pdf.png";
    case "doc":
    case "docx":
      return "/icons/add-content/doc.png";
    case "ppt":
    case "pptx":
      return "/icons/add-content/ppt.png";
    default:
      // noinspection SpellCheckingInspection
      return "/icons/add-content/directbox-send.png";
  }
}