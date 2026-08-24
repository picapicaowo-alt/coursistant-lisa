import { useEffect } from 'react';
import AnnouncementCard from './AnnouncementCard';

function AnnouncementModal({ loading, announcements, canCreate, onClose, onCreate }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const PlaceholderCard = () => (
    <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-sm text-gray-400">
      No announcements yet.
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
      <div className="w-[36rem] min-h-[38rem] max-h-[38rem] bg-white rounded-xl shadow-2xl p-6 flex flex-col">
        <div className="flex items-center justify-between py-2">
          <h2 className="text-lg font-semibold">Notification</h2>
          <div className="flex gap-3 items-center">
            {canCreate && (
              <button onClick={onCreate} className="bg-[rgba(86,111,232,1)] text-white px-4 py-1.5 text-sm rounded-lg hover:bg-[rgba(86,111,232,0.8)] cursor-pointer">
                Create
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
              <img src="/icons/chat/announcement/close-circle.png" className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-5 space-y-5 overflow-y-auto flex-1 min-h-0">
          {loading && <p className="text-center text-sm text-gray-400">Loading…</p>}
          {!loading && announcements.length > 0 &&
            announcements.map((ann) => <AnnouncementCard key={ann.id} ann={ann} />)}
          {!loading && announcements.length === 0 && <PlaceholderCard />}
        </div>
      </div>
    </div>
  );
}

export default AnnouncementModal;