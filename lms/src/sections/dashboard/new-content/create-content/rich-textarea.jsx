import { useRef, useState } from "react";

export default function RichTextEditor() {
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const handleInput = () => {
    const text = editorRef.current.innerText.trim();
    setIsEmpty(text === "");
  };
  const applyFormat = (command) => {
    document.execCommand(command, false, null);
    editorRef.current.focus();
  };

  return (
      <div className="w-full mt-6 p-3 bg-transparent rounded-xl border-[1.5px] border-[rgba(203,213,224,1)]">
        {/* Toolbar */}
        <div className="flex space-x-4 text-gray-500 text-sm pb-2">
          <img src="/icons/add-content/text-bold.png" onClick={() => applyFormat("bold")} className="cursor-pointer"/>
          <img src="/icons/add-content/firstline.png" onClick={() => applyFormat("italic")} className="cursor-pointer"/>
          <img src="/icons/add-content/text-italic.png" onClick={() => applyFormat("italic")} className="cursor-pointer"/>
          <img src="/icons/add-content/text-underline.png" onClick={() => applyFormat("underline")} className="cursor-pointer"/>
          <img src="/icons/add-content/smallcaps.png" onClick={() => applyFormat("insertUnorderedList")} className="cursor-pointer"/>
        </div>
        <div className="w-[calc(100%+1.6rem)] ml-[-0.8rem] border-t-[1.5px] border-dashed border-[rgba(203,213,224,1)] mb-2" />
        {/* Editable Content Area */}
        <div className="relative w-full h-24 p-1 rounded-lg">
            {/* Placeholder */}
            {isEmpty && (
                <span className="absolute text-gray-400 pointer-events-none select-none">
                Comment...
                </span>
            )}

            {/* Editable Box */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                className="w-full h-full outline-none text-gray-700"
            />
        </div>
      </div>
  );
}
