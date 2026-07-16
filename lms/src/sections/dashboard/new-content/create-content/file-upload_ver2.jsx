import { useRef, useState, useEffect } from "react";

export default function FileUploadBox({ setIsHavingContent }) {
  const fileInputRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const uploadIntervalRef = useRef(null);

  // Drag handlers
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
    const fileList = Array.from(files).map((file, idx) => ({
      id: Date.now() + idx,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      type: file.name.split(".").pop().toLowerCase(),
      progress: 0,
      status: "queue",
      timeLeft: "5 secs left",
    }));
    const newUploads = [...uploads, ...fileList];
    setUploads(newUploads);
    setIsHavingContent(newUploads.length > 0);
  };

  const startUpload = (fileId) => {
    if (uploadIntervalRef.current) return;

    let progress = 0;
    uploadIntervalRef.current = setInterval(() => {
      progress += 5;
      setUploads((prev) =>
        prev.map((file) => {
          if (file.id !== fileId) return file;
          if (progress >= 100) {
            clearInterval(uploadIntervalRef.current);
            uploadIntervalRef.current = null;
            return { ...file, progress: 100, status: "completed", timeLeft: "" };
          }
          const secs = `${Math.max(1, Math.ceil((100 - progress) / 20))} secs left`;
          return { ...file, progress, status: "uploading", timeLeft: secs };
        })
      );
    }, 100);
  };

  useEffect(() => {
    const uploading = uploads.find((file) => file.status === "uploading");
    const nextInQueue = uploads.find((file) => file.status === "queue");

    if (!uploading && nextInQueue) {
      startUpload(nextInQueue.id);
    }
  }, [uploads]);

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
      {uploads
          .slice()
          .sort((a, b) => {
            const statusOrder = { queue: 0, uploading: 1, completed: 2 };
            return statusOrder[a.status] - statusOrder[b.status];
          })
          .map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center space-x-3 px-5 pt-5 pb-3 border-[1.5px] border-[rgba(203,213,224,1)] rounded-xl"
                  >
                    <div className="w-full">
                      <div className="flex items-center space-x-3">
                        <img
                          className="rounded-lg flex items-center justify-center font-bold uppercase text-xs"
                          src={getIcon(file.type)}
                          alt="Upload icon"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium truncate">{file.name}</div>
                          <div className="text-xs text-[#A0AEC0] flex items-center gap-2">
                            <span>{file.size}</span>
                            {file.status === "uploading" && (
                              <>
                                <span>-</span>
                                <span>{file.timeLeft}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Status visual */}
                        <div className="w-6 h-6 flex items-center justify-center">
                          {file.status === "completed" ? (
                            // Tick icon
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#48BB78"/>
                            </svg>

                          ) : file.status === "queue" ? (
                            // Spinner
                            <div className="w-5 h-5 border-3 border-[#CBD5E0] border-t-[#566FE8] rounded-full animate-spin" />
                          ) : (
                            // Uploading - show %
                            <span className="text-xs text-[#A0AEC0]">{file.progress}%</span>
                          )}
                        </div>
                      </div>
                      {file.status === "uploading" && (
                        <div className="w-full bg-[#A0AEC0] h-1 rounded mt-3">
                          <div
                            className="bg-[#566FE8] h-1 rounded transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
      </div>
    </div>
  );
}

