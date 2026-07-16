import { useState, useRef, useEffect } from 'react';
import MiniProfile from './MiniProfile';

export default function DirectMessageContent({ selectedChatSectionParams }) {
    const {
        name = 'Unknown',
        avatar: rawAvatar = '/icons/chat/friends/_Avatar base.png',
        mutual = 'placeholder'
    } = selectedChatSectionParams ?? {};

    const [wave, setWave] = useState(false);
    const [msgs, setMsgs] = useState([]);
    const [miniOpen, setMiniOpen] = useState(false);


    const inputRef = useRef(null);
    const listRef = useRef(null);

    const avatar = rawAvatar || '/icons/chat/friends/_Avatar base.png';

    // always scroll to the latest message
    useEffect(() => {
        listRef.current?.scrollTo(0, listRef.current.scrollHeight);
    }, [msgs]);

    const send = () => {
        const txt = inputRef.current.value.trim();
        if (!txt) return;
        setMsgs(m => [...m, { me: true, txt }]);
        inputRef.current.value = '';
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* top bar */}
            <div className="h-12 border-b border-[rgba(203,213,224,.9)] flex items-center px-6 shrink-0">
                <img src={avatar} className="w-6 h-6 rounded-full mr-2" />
                <h3 className="text-sm font-medium flex-1">{name}</h3>

                {/* top four buttons */}
                <div className="flex gap-4 text-gray-500 text-[17px] items-center ml-auto">
                    <img src="/icons/chat/direct-message/video.png" className="w-5 h-5 cursor-pointer" />
                    <img src="/icons/chat/direct-message/microphone.png" className="w-5 h-5 cursor-pointer" />
                    <img src="/icons/chat/direct-message/profile-add.png" className="w-5 h-5 cursor-pointer" />
                    <button onClick={() => setMiniOpen(p => !p)}>
                        <img
                            src="/icons/chat/direct-message/user-square.png"
                            className="w-5 h-5 cursor-pointer"
                            alt="Friend mini profile"
                        />
                    </button>

                    {/* search box */}
                    <div className="flex items-center h-8 pl-3 pr-3 gap-2 border border-[#CBD5E0] rounded-[10px]">
                        <img src="/icons/chat/direct-message/Frame 1010109395.png" className="w-8 h-8 opacity-60" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="bg-transparent outline-none text-sm placeholder:text-[#A0AEC0] w-32"
                        />
                    </div>
                </div>
            </div>
            <div className={miniOpen ? 'flex flex-col flex-1 pr-[280px]' : 'flex flex-col flex-1'}>
                {/* scrollable conversation area */}
                <div className="flex-1 overflow-y-auto relative">
                    <div className="pl-12 pr-6 pt-12 max-w-[950px]">

                        {/* profile info */}
                        <div className="flex items-start gap-6
                                    absolute left-12 bottom-6
                                    sm:left-16 md:left-24 lg:left-32">
                            <div className="relative">
                                <img src={avatar} className="w-[112px] h-[112px] rounded-full" />
                                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white" />
                            </div>

                            <div className="pt-3">
                                <h2 className="text-lg font-semibold">{name}</h2>
                                <p className="text-sm text-[#718096]">
                                    {name.toLowerCase().replace(' ', '@')}@mercure.studio
                                </p>

                                <p className="text-xs mt-3 mb-3 text-gray-500">
                                    This is the beginning of your direct message history with&nbsp;
                                    {name.split(' ')[0]}.
                                </p>

                                <div className="flex items-center gap-4 text-sm">
                                    <button
                                        onClick={() => alert(`Open mutual group: ${mutual}`)}
                                        className="flex items-center gap-[6px]"
                                    >
                                        <img src="/icons/chat/direct-message/messages-2.png" className="w-4 h-4" />
                                        <span className="hover:underline cursor-pointer">
                                            1&nbsp;Mutual&nbsp;Group
                                        </span>
                                    </button>

                                    <button
                                        disabled={wave}
                                        onClick={() => {
                                            setWave(true);
                                            setTimeout(() => setWave(false), 1000);
                                        }}
                                        className={`w-[171px] h-[32px] rounded-[10px] px-[10px] py-[6px] text-sm font-medium
                                        ${wave
                                                ? 'bg-gray-200 text-gray-400 cursor-default'
                                                : 'bg-[#566FE8] text-white hover:opacity-90'}`}
                                    >
                                        {wave ? '👋 Waved!' : `Wave to ${name.split(' ')[0]} 👋`}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* messages list */}
                        <div
                            ref={listRef}
                            className="flex flex-col gap-4 mt-10 pb-44 pr-2 overflow-y-auto"
                        >
                            {msgs.map((m, i) => (
                                <div
                                    key={i}
                                    className={`max-w-[60%] px-4 py-2 rounded-lg text-sm
                                    ${m.me ? 'ml-auto bg-sky-500 text-white' : 'bg-white border'}`}
                                >
                                    {m.txt}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* composer */}
                <div className="py-6 pl-12 sm:pl-16 md:pl-24 lg:pl-32">
                    <div className="relative max-w-[844px] w-full">
                        <div className="flex items-center h-[104px] w-full border border-[#CBD5E0] rounded-[15px] px-6">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Message General"
                                className="flex-1 h-12 outline-none text-sm placeholder:text-[#A0AEC0] bg-transparent"
                                onKeyDown={e => e.key === 'Enter' && send()}
                            />

                            {/* right side icons */}
                            <div className="flex items-center gap-4 mr-6">
                                <img src="/icons/chat/direct-message/gallery.png" className="w-5 h-5 cursor-pointer" />
                                <img src="/icons/chat/direct-message/Frame 1.png" className="w-5 h-5 cursor-pointer" />
                                <img src="/icons/chat/direct-message/艾特 (1) 1.png" className="w-5 h-5 cursor-pointer" />
                                <img src="/icons/chat/direct-message/表情 1.png" className="w-5 h-5 cursor-pointer" />
                            </div>

                            <button
                                onClick={send}
                                className="w-[55px] h-[24px] text-sm bg-[#CBD5E0] rounded-[10px] text-white"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* mini profile drawer */}
            {miniOpen && (
                <MiniProfile
                    key={name}
                    friend={{
                        name,
                        email: `${name.toLowerCase().replace(' ', '@')}@mercure.studio`,
                        avatar,
                        info: 'Computer Science 2023',
                        mutual: 'Mutual Group 1',
                    }}


                />
            )}
        </div>
    );
}
