import { useState } from 'react';
import axios from 'axios';

import FileUploadBox from 'src/sections/dashboard/new-content/create-content/file-upload';
import {RichTextEditor} from 'src/components/RichTextEditor';

function CreateAnnouncementModal({ onClose, setIsHavingContent, token, refresh }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);

    const publish = async () => {
        if (!title.trim() && !content.trim()) return;          // both empty
        if (!title.trim()) return;                           // or just title
        if (!content.trim()) return;                           // or just content

        try {
            setSaving(true);

            let authToken = token;
            if (!authToken) {
                const login = await axios.post(
                    'https://dash.coursistant.com:8086/api/login',
                    { email: '123', password: '123', role: 'USER' }
                );
                authToken = login.data?.data?.accessToken;
            }

            const nowIso = new Date().toISOString();
            await axios.post(
                'https://dash.coursistant.com:8086/api/announcement/add',
                {
                    title,
                    content,
                    courseId: 0, //place holder
                    createdAt: nowIso,
                    updatedAt: nowIso,
                    userId: 0, //backend will overwrite this
                    name: 'NA',
                    id: 0
                },
                { headers: { token: authToken } }
            );

            refresh?.(authToken); // pull the updated list
            onClose();
        } catch (e) {
            console.error('publish failed', e);
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
            <div className="w-[36rem] min-h-[32rem] bg-white rounded-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Announcement</h2>
                    <button
                        aria-label="Close"
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full cursor-pointer"
                    >
                        <img src="/icons/chat/announcement/close-circle.png" className="w-4 h-4" alt="Close" />
                    </button>
                </div>

                <div className="flex justify-center mb-6">
                    <input
                        type="text"
                        placeholder="Enter a one line summary, 100 characters or less"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="text-4xl text-center w-full border-none placeholder-gray-400 outline-none"
                        style={{ fontSize: '1.2rem' }}
                    />
                </div>

                <div className="text-sm text-gray-500 space-y-3 mb-4">
                    <div className="flex items-center gap-3">
                        <img src="/icons/chat/announcement/calendar_gray.png" className="w-4 h-4" />
                        <span className="w-32">Release time</span>
                        <span className="w-24 text-right">Empty</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <img src="/icons/chat/announcement/clock.png" className="w-4 h-4" />
                        <span className="w-32">Deadline time</span>
                        <span className="w-24 text-right">Empty</span>
                    </div>
                </div>

                <hr className="my-4 border-gray-200" />

                <div className="relative mb-8">
                    <RichTextEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Type description here ..."
                        ariaLabel="Announcement description"
                    />
                    <img
                        src="/icons/chat/announcement/Frame 1010109876.png"
                        className="absolute top-2 left-2 w-4 h-4 pointer-events-none"
                        alt="description icon"
                    />
                </div>

                <div className="mt-8">
                    <p className="text-sm font-medium mb-1">Upload files</p>
                    <p className="text-xs text-gray-400 mb-2">Max file size is 20MB. Supported file types are .pdf/.doc/.jpg/.png/.ppt</p>
                    <FileUploadBox setIsHavingContent={setIsHavingContent} />
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                        Cancel
                    </button>
                    <button
                        disabled={saving || !title.trim() || !content.trim()}
                        onClick={publish}
                        className={`bg-indigo-500 text-white px-5 py-2 rounded-lg
                            ${saving || !title.trim() || !content.trim()
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer hover:bg-indigo-600'
                            }`}>
                        {saving ? 'Publishing…' : 'Publish'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateAnnouncementModal;
