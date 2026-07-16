const ChatHeader = ({params, onAddNew, setShowHistory}) => {
    return (
        <div className='flex flex-row justify-between flex-1'>
            {/* Left: Icon + Title */}
            <div className="flex items-center space-x-2 text-[#3B5CCC] font-medium text-base">
                <img src="/icons/chat/ai-icon.png" alt="AI" className="w-4 h-4" />
                <span>Ai Chat</span>
            </div>

            {/* Right: Buttons + Search */}
            <div className="flex items-center space-x-2">
                {/* Notebook Button */}
                <button className="w-8 h-8 cursor-pointer border border-[#CBD5E1] rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all duration-300">
                <img src="/icons/chat/stickynote.png" alt="Notebook" onClick={() => { setShowHistory(prev => !prev); }} />
                </button>

                {/* Plus Button */}
                <button className="w-8 h-8 cursor-pointer bg-[rgba(86,111,232,1)] hover:bg-[rgba(75,89,177,1)] rounded-lg flex items-center justify-center transition-all duration-300" 
                    onClick={() => { onAddNew(); }}>
                <span className="text-white text-xl">+</span>
                </button>

                {/* Search Box */}
                <div className="flex items-center border border-[#CBD5E1] rounded-lg px-2 py-1 w-48">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search"
                        className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                    />
                </div>
            </div>
        </div>
    )
}

export default ChatHeader;