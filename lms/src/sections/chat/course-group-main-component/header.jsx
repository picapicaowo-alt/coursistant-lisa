import { useNavigate } from "react-router-dom";

const CourseGroupHeader = ({params, setRosterOpen}) => {
    const navigate = useNavigate();
    const label = params.title;
    const courseId = params.courseId;
    const icons = [
        {
            icon: "/icons/chat/course-group/share-icon.png",
            alt: "Share"
        },
        {
            icon: "/icons/chat/course-group/pencil-icon.png",
            alt: "Pencil"
        },
        {
            icon: "/icons/chat/course-group/user-icon.png",
            alt: "Users"
        },
        {
            icon: "/icons/chat/course-group/globe-icon.png",
            alt: "Globe"
        }
    ]
    const handleIconClick = (icon) => {
        if (icon.alt === "Users") {
            // navigate("/roster");
            setRosterOpen((prev) => !prev);
        }
        if (icon.alt === "Globe") {
            console.log("params", params);
            navigate(`/roster/${courseId}`);
        }
    }
    return (
        <div className='flex flex-row justify-between flex-1'>
            {/* Left: Folder label */}
            <div className="flex items-center gap-2 truncate max-w-[200px]">
                <img src="/icons/chat/course-group/folder-icon.svg" alt="Folder" />
                <span className="text-sm text-gray-800 truncate">{label}</span>
            </div>

            {/* Right: Buttons + Search */}
            <div className="flex items-center space-x-2">
                {/* Center: Icons */}
                <div className="flex items-center  mr-4 text-gray-400">
                    {icons.map((icon, index) => (
                        <img key={index} src={icon.icon} alt={icon.alt} className="cursor-pointer w-9 h-9 p-2 hover:bg-[rgba(226,232,240,1)]" onClick={() => handleIconClick(icon)}/>
                    ))}
                </div>

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

export default CourseGroupHeader;