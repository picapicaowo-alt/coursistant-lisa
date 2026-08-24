import MarkdownMessage from 'src/components/MarkdownMessage';

function AnnouncementCard({ ann }) {
    /* format dates */
    const created = new Date(ann.createdAt);
    const createdTs = created.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    /*  Hard‑coded placeholders  */
    const peopleCount = 112;// until the API gives a real number
    const deadlineLabel = 'Thu May 15th · 1:00 AM';
    const attachment = {
        name: 'ReactJS-for-beginner.pdf',
        size: '4.5 MB',
    };

    return (
        <div className="border border-gray-200 rounded-xl p-4 space-y-4 text-[15px]">
            {/* Date / People Row */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <img src="/icons/chat/announcement/calendar_green.png" className="w-4 h-4" />
                <span>{createdTs}</span>

                <div className="ml-auto flex items-center gap-2">
                    <img
                        src="/icons/chat/announcement/_Avatar item.png"
                        className="w-6 h-6 rounded-full border"
                        alt="avatar"
                    />
                    <button className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs
                               text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer">
                        <img src="/icons/chat/announcement/profile-2user.png" className="w-4 h-4" />
                        {peopleCount}
                    </button>
                </div>
            </div>

            {/* Title & Description */}
            <div>
                <h3 className="font-semibold mb-1">{ann.title}</h3>
                <MarkdownMessage className="text-sm text-gray-600 leading-relaxed" content={ann.content} />
            </div>

            {/* Deadline Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                    <img src="/icons/chat/announcement/calendar_purple.png" className="w-4 h-4" />
                    {deadlineLabel}
                </div>
                <button className="flex items-center gap-1 border bg-gray-100 rounded-lg px-3 py-1
                             text-sm text-gray-700 hover:bg-gray-200 cursor-pointer">
                    <img src="/icons/chat/announcement/notification.png" className="w-4 h-4" />
                    Interested
                </button>
            </div>

            <hr className="border-t border-gray-200" />

            {/* Attachment Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/icons/chat/announcement/Group 1231.png" className="w-5 h-6" />
                    <div>
                        <p className="text-sm">{attachment.name}</p>
                        <p className="text-xs text-gray-400">{attachment.size}</p>
                    </div>
                </div>
                <button className="flex items-center gap-1 border bg-gray-100 rounded-lg px-3 py-1
                             text-sm text-gray-700 hover:bg-gray-200 cursor-pointer">
                    <img src="/icons/chat/announcement/directbox-receive.png" className="w-4 h-4" />
                    Download
                </button>
            </div>
        </div>
    );
}

export default AnnouncementCard;
