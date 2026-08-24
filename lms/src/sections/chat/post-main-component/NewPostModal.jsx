import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import {RichTextEditor} from 'src/components/RichTextEditor';

export default function NewPostModal({ open, onClose }) {
  const [title, setTitle] = useState('');
  const [postType, setPostType] = useState('');
  const [releaseTime, setReleaseTime] = useState('');
  const [folders, setFolders] = useState([]);
  const [postTo, setPostTo] = useState('');
  const [content, setContent] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setCharCount(newContent.length);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="flex flex-col bg-white rounded-lg shadow-lg w-full mx-auto overflow-hidden"
        style={{ maxWidth: '950px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6">
          <h1 className="font-inter text-[28px] leading-[36px] ml-[18px] tracking-[0%] text-[#2D3748]">
            New Post
          </h1>

          <button
            className="text-gray-400 hover:text-gray-600 ml-4"
            aria-label="Expand"
          >
            <Maximize2 size={20} />
          </button>
        </div>

        <div className="p-6 ml-16">
          <div className="mb-8">
            <input
              type="text"
              className="w-full text-3xl text-gray-600 border-none outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a one line summary, 100 characters or less"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-40 flex items-center text-gray-400">
                <img
                  src="/icons/posts/post_type.png"
                  alt="Post Type"
                  className="w-4 h-4 mr-2"
                />
                <span className="text-sm">Post Type</span>
              </div>
              <input
                type="text"
                className="text-sm ml-18 text-gray-800 font-medium border-none outline-none bg-transparent"
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                placeholder="Empty"
              />
            </div>

            <div className="flex items-center">
              <div className="w-40 flex items-center text-gray-400">
                <img
                  src="/icons/posts/clock.png"
                  alt="Release time"
                  className="w-4 h-4 mr-2"
                />
                <span className="text-sm">Release time</span>
              </div>
              <input
                type="text"
                className="text-sm ml-18 text-gray-800 font-medium border-none outline-none bg-transparent"
                value={releaseTime}
                onChange={(e) => setReleaseTime(e.target.value)}
                placeholder="Empty"
              />
            </div>

            <div className="flex items-center">
              <div className="w-40 flex items-center text-gray-400">
                <img
                  src="/icons/posts/select_folder.png"
                  alt="Select Folder(s)"
                  className="w-4 h-4 mr-2"
                />
                <span className="text-sm">Select Folder(s)</span>
              </div>
              <input
                type="text"
                className={`text-sm ml-18 border-none outline-none ${
                  folders.join(', ').trim()
                    ? 'px-1.5 py-1 rounded bg-gray-200 text-gray-800'
                    : 'bg-transparent'
                }`}
                value={folders.join(', ')}
                onChange={(e) => setFolders(e.target.value.split(',').map(folder => folder.trim()))}
                placeholder="Empty"
              />
            </div>

            <div className="flex items-center">
              <div className="w-40 flex items-center text-gray-400">
                <img
                  src="/icons/posts/post_to.png"
                  alt="Post To"
                  className="w-4 h-4 mr-2"
                />
                <span className="text-sm">Post To</span>
              </div>
              <input
                type="text"
                className="text-sm ml-18 text-gray-800 font-medium border-none outline-none bg-transparent"
                value={postTo}
                onChange={(e) => setPostTo(e.target.value)}
                placeholder="Empty"
              />
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6 flex flex-row w-[90%] items-start">
            <div
              className="flex flex-row items-start mr-2"
              style={{ width: '48px', marginLeft: '-58px', minWidth: '48px' }}
            >
              <button className="p-0 hover:bg-gray-100 rounded flex items-center justify-center mr-1" style={{ lineHeight: 0 }}>
                <img
                  src="/icons/posts/plus.png"
                  alt="plus"
                  className="w-5 h-5 aspect-square object-contain"
                  style={{ display: 'block' }}
                />
              </button>
              <button className="p-0 hover:bg-gray-100 rounded flex items-center justify-center" style={{ lineHeight: 0 }}>
                <img
                  src="/icons/posts/colon.png"
                  alt="colon"
                  className="w-5 h-5 aspect-square object-contain"
                  style={{ display: 'block' }}
                />
              </button>
            </div>
            <div className="flex-1">
              <RichTextEditor
                content={content}
                onChange={handleContentChange}
                placeholder="Type description here ..."
                ariaLabel="Post description"
              />
              <div className="text-right mt-8 text-gray-400">{charCount}/400</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6">
          <button className="border border-gray-300 text-gray-600 px-6 py-2 rounded-xl flex items-center mr-3">
            <span className="mr-2">
              <img
                src="/icons/posts/arrow.png"
                alt="Publish"
                className="w-4 h-4"
                style={{ display: 'inline-block' }}
              />
            </span>
            <span className="text-[#A0AEC0]">Publish</span>
          </button>
          <button
            className="bg-[#566FE8] hover:bg-blue-600 text-white px-8 py-2 rounded-xl"
            onClick={onClose}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
