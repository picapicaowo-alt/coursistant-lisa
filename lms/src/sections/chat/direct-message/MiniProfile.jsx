import { useState } from 'react';

export default function MiniProfile({ friend }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="absolute right-0 top-12 bottom-0 w-[280px] border-l
                    border-[rgba(203,213,224,.9)] shadow-xl z-50 flex flex-col">

            {/* banner */}
            <div className="relative h-[104px]">
                <img
                    src="/icons/chat/direct-message/Image.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover rounded-t-[1px]"
                />

                {/* three dot menu button */}
                <button
                    onClick={() => setMenuOpen(p => !p)}
                    className="absolute top-2 right-2 p-1 rounded-full"
                >
                    <img src="/icons/chat/direct-message/more.png" className="w-4 h-4 cursor-pointer" />
                </button>

                {/* avatar */}
                <img
                    src={friend.avatar}
                    className="absolute -bottom-6 left-4 w-16 h-16 rounded-full border-4 border-white shadow z-10"
                />

                {/* pop up menu */}
                {menuOpen && (
                    <div className="absolute right-2 top-9 w-44 bg-white rounded-xl shadow-lg
                          border border-[rgba(203,213,224,1)] text-sm z-50">
                        <div
                            onClick={() => alert('view profile')}
                            className="px-4 py-2 hover:bg-gray-100 rounded-t-xl cursor-pointer"
                        >
                            View Full Profile
                        </div>
                        <div
                            onClick={() => alert('invite to group')}
                            className="px-4 py-2 hover:bg-gray-100 rounded-b-xl cursor-pointer"
                        >
                            Invite to Group
                        </div>
                    </div>
                )}
            </div>

            {/*  core */}
            <div className="px-4 pt-8">
                <h4 className="font-medium">{friend.name}</h4>
                <p className="text-xs text-gray-500 mb-4">{friend.email}</p>

                <div className="space-y-2 text-xs font-medium">
                    <div className="bg-[#E2E8F0] rounded-lg px-3 py-2">
                        Information
                        <div className="font-normal">{friend.info}</div>
                    </div>
                    <div className="bg-[#E2E8F0] rounded-lg px-3 py-2">{friend.mutual}</div>
                </div>
            </div>
        </div>
    );
}
