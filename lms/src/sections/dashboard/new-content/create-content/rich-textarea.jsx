import {useState} from "react";
import {RichTextEditor as MarkdownRichTextEditor} from "src/components/RichTextEditor";

export default function RichTextEditor() {
  const [content, setContent] = useState("");

  return (
    <div className="w-full mt-6">
      <MarkdownRichTextEditor
        content={content}
        onChange={setContent}
        placeholder="Comment..."
        ariaLabel="Comment"
      />
    </div>
  );
}
