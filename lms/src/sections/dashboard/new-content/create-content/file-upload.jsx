import { useRef, useState, useEffect } from "react";

export default function FileUploadBox({setIsHavingContent, file, setFile}) {
  const fileInputRef = useRef(null);
  const [uploads, setUploads] = useState(() => file ? [file] : []);
  const [isDragging, setIsDragging] = useState(false);
  // Drag event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleChooseClick = () => fileInputRef.current.click();

  const handleFiles = (files) => {
    const fileList = Array.from(files).map((file) => ({
      file: file,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      type: file.name.split(".").pop().toLowerCase(),
      progress: 0,
    }));

    const newUploads = [...uploads, ...fileList];
    setUploads(newUploads);
    if (setIsHavingContent) {
      setIsHavingContent(newUploads.length > 0);
    }
    if (setFile && fileList.length > 0) {
      const lastFile = { ...fileList[fileList.length - 1], progress: 100 };
      setFile(lastFile);
  }
  };

  // Simulate upload progress
  useEffect(() => {
    const interval = setInterval(() => {
      setUploads((prev) =>
        prev.map((file) =>
          file.progress < 100
            ? { ...file, progress: file.progress + 30 }
            : file
        )
      );
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "pdf":
        return "/icons/add-content/pdf.png";
      case "doc":
      case "docx":
        return "/icons/add-content/doc.png";
      case "ppt":
      case "pptx":
        return "/icons/add-content/ppt.png";
      default:
        return "/icons/add-content/directbox-send.png";
    }
  };
  return (
    <div className="space-y-4">
      {/* Upload Box */}
      <div
        className={`border-[1.5px] border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center text-center ${
            isDragging ? "bg-blue-50 border-blue-400" : ""
        } transition cursor-pointer`}
        onClick={handleChooseClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <img className="mb-2" src="/icons/add-content/directbox-send.png" alt="Upload icon" />
        <p className="text-gray-600 text-sm">
          Drag and drop files here or{" "}
          <span className="text-blue-600 hover:underline">Choose</span> file to upload
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Upload List */}
      <div className="space-y-4">
        {uploads.map((file, idx) => (
          <div key={idx} className="flex items-center space-x-3 px-5 pt-5 pb-3 border-[1.5px] border-[rgba(203,213,224,1)] rounded-xl">
            <div className="w-full">
                <div className="flex items-center space-x-3">
                    <img className="rounded-lg flex items-center justify-center font-bold uppercase text-xs" src={getIcon(file.type)} alt="Upload icon" />
                    <div className="flex-1">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="text-xs text-gray-500">
                        {file.size} - {file.progress < 100 ? `${Math.ceil((100 - file.progress) / 10)} secs left` : "Done"}
                    </div>
                    </div>
                </div>
                {file.progress < 100 && (
                    <div className="w-full bg-gray-200 h-1 rounded mt-3">
                        <div className="bg-blue-500 h-1 rounded transition-all duration-300" style={{ width: `${file.progress}%` }} />
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}