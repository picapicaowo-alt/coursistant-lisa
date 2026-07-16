// src/pages/aibot/index.jsx
import React, { lazy, Suspense } from 'react';
const ChatContent = lazy(() => import('../../sections/chat/chat-main-component'));

export default function AIBotPage() {
  return (
    <div className="flex h-[calc(100vh-110px)] min-h-0 overflow-hidden flex-col">

      {/* 
      <div className="shrink-0 w-full px-6 py-3 border-b border-slate-200 bg-white">
      </div>
 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Suspense fallback={<div className="p-6">Loading…</div>}>

          <div className="h-full min-h-0">
            <ChatContent
              isIntroTop
              isSummary={false}
              isDashboard={false}
              isPopup={false}
              showHistory={false}
            />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
