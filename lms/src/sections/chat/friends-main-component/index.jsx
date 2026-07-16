import { useState, useRef } from 'react';

/* mock payload you get back from “search friend” */
const DUMMY_PROFILE = {
    name: 'Eleanor Pena',
    email: 'eleanor@mercure.studio',
    banner: '/icons/chat/friends/Image-wrap.png',
    avatar: '/icons/chat/friends/_Avatar base.png',
    about: "Sorry I'm not a moderator.\nI won't reply your questions. ✋",
    role: 'Computer Science 2023',
    roleIcon: '/icons/chat/friends/teacher.svg',
    mutualGroups: ['Homework Group-A'],
};

export default function FriendsPanel() {
    const [query, setQuery] = useState('');
    const [profile, setProfile] = useState(null);
    const inputRef = useRef(null);

    /* ────────── helpers ────────── */
    const handleSearch = () => {
        if (!query.trim()) return;
        /* TODO: replace with real API call */
        setProfile(DUMMY_PROFILE);
    };

    const reset = () => {
        setProfile(null);
        setQuery('');
        inputRef.current?.focus();
    };

    /* ────────── shared card styles ────────── */
    const cardHeight = profile ? 'h-[700px]' : 'h-[300px]';
    const CARD_CLASS =
        `w-[600px] ${cardHeight} rounded-xl border border-[#E2E8F0] ` +
        'bg-white shadow-sm px-10 py-8 relative overflow-hidden';

    return (
        <div className="flex justify-center items-start pt-[228px] flex-1">
            <div className={CARD_CLASS}>
                {/* ───────────────── SEARCH STATE ───────────────── */}
                {!profile && (
                    <>
                        <h3 className="text-xl font-semibold mb-2">Add Friend</h3>
                        <p className="text-sm text-[#A0AEC0] mb-6">
                            You can add friends by e-mail or student ID
                        </p>

                        <div className="relative">
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                type="text"
                                placeholder="Mia Watson"
                                className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2 pr-[95px] text-sm
                       focus:outline-none focus:ring-[rgba(101,122,227,0.5)]
                       focus:border-[rgb(104,123,218)]"
                            />

                            <button
                                onClick={handleSearch}
                                className="absolute right-[14px] top-1/2 -translate-y-1/2
                       w-[75px] h-[32px] rounded-[8px] bg-[#E2E8F0]
                       text-sm text-gray-700 flex items-center justify-center
                       hover:bg-[#d4d9e2] active:bg-[#c3c9d3] cursor-pointer">
                                Search
                            </button>
                        </div>
                    </>
                )}

                {/* ───────────────── PROFILE STATE ───────────────── */}
                {profile && (
                    <div className="absolute inset-0 flex flex-col">
                        {/* banner */}
                        <div
                            className="h-[200px] w-full rounded-t-xl bg-cover bg-center"
                            style={{ backgroundImage: `url(${profile.banner})` }}
                        />

                        {/* avatar + online indicator */}
                        <div className="relative -mt-9 ml-8 w-[112px] h-[112px]">
                            <img
                                src={profile.avatar}
                                className="w-full h-full rounded-full border-4 border-white"
                                alt=""
                            />
                            <img
                                src="/icons/chat/friends/_Avatar-online-indicator.png"
                                className="absolute bottom-0 right-0 w-6 h-6"
                                alt=""
                            />
                        </div>

                        {/* name & email */}
                        <div className="mt-2 ml-8">
                            <h4 className="text-lg font-semibold">{profile.name}</h4>
                            <p className="text-sm text-gray-500">{profile.email}</p>
                        </div>

                        {/* action buttons */}
                        <div className="absolute top-[220px] right-8 flex gap-3">
                            <button className="h-[32px] px-4 rounded-lg border border-gray-300
                                 text-sm text-gray-700 flex items-center gap-1 hover:bg-gray-100 cursor-pointer">
                                <img src="/icons/chat/friends/user-add.png" className="w-4 h-4" />
                                Friends
                            </button>
                            <button className="h-[32px] px-4 rounded-lg border border-gray-300
                                 text-sm text-gray-700 flex items-center gap-1 hover:bg-gray-100 cursor-pointer">
                                <img src="/icons/chat/message-icon.svg" className="w-4 h-4" />
                                Message
                            </button>
                        </div>

                        {/* simple tabs */}
                        <div className="mt-6 ml-8 flex gap-6 text-sm font-medium">
                            <button className="pb-1 border-b-2 border-gray-800 cursor-pointer">
                                About Me
                            </button>
                            <button
                                onClick={() => alert('none')}
                                className="text-gray-500 cursor-pointer">
                                Mutual Group {profile.mutualGroups.length}
                            </button>
                        </div>

                        {/* about text */}
                        <p className="mt-4 ml-8 whitespace-pre-line text-sm text-gray-700">
                            {profile.about}
                        </p>

                        {/* role */}
                        <div className="mt-4 ml-8 flex items-center gap-2 text-xs text-gray-500">
                            <img src={profile.roleIcon} className="w-4 h-4" alt="" />
                            <span>{profile.role}</span>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

