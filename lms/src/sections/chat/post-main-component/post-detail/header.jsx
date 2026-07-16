
const PostDetailHeader = ({params, onBack}) => {
    const { title } = params;
    return (
        <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
                {/* Back Button */}
                <button className="cursor-pointer hover:opacity-70 transition-opacity duration-300" onClick={onBack}>
                    <img src="/icons/course/arrow-left-v3.png" alt="arrow-left" />
                </button>
                {/* Title */}
                <div className="flex items-center text-lg font-semibold text-[20px] text-[rgba(45,55,72,1)]">
                    {title}
                </div>
            </div>
            {/* Next Button */}
            <button className="bg-[rgba(86,111,232,1)] cursor-pointer hover:bg-[rgba(86,111,232,0.8)] text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-1">
                Next
                <img src="/icons/course/arrow-right-v2.png" alt="arrow-right" />
            </button>
        </div>
    )
}

export default PostDetailHeader;