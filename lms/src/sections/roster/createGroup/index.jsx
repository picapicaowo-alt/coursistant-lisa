import { useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";
import { useState, useRef, useEffect } from "react";
const CreateGroup = () => {
    const navigate = useNavigate();
    const [assigned, setAssigned] = useState([]);
    const students = Array(15).fill({ name: "Mia Watson", avatar: "/icons/roster/avatar_base_10.png" });
    const groupColors = [
        '#000000', '#4A5568', '#A0AEC0', '#9F7AEA',
        '#6B46C1', '#2C7A7B', '#38A169', '#D53F8C',
        '#ED64A6', '#DD6B20', '#ECC94B', '#4299E1'
    ];
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedColor, setSelectedColor] = useState(null);
    const [searchText, setSearchText] = useState("");
    const dropdownRef = useRef(null);
    const [isAutoAssign, setIsAutoAssign] = useState(false);
    const toggleAssign = (index) => {
        if (assigned.includes(index)) {
            setAssigned(assigned.filter(i => i !== index));
        } else {
            setAssigned([...assigned, index]);
        }
    };
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setDropdownOpen(false);
        }
    };
    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);
    const unselectAll = () => setAssigned([]);
    return (
        <div className="w-full">
            <div className="w-full flex items-center justify-between px-6 py-3">
                {/* Back Button */}
                <button className="cursor-pointer hover:opacity-70 transition-opacity duration-300" onClick={() => navigate(-1)}>
                    <img src="/icons/course/arrow-left-v2.png" alt="arrow-left" />
                </button>
                {/* Next Button */}
                <button className="bg-[rgba(86,111,232,1)] cursor-pointer hover:bg-[rgba(86,111,232,0.8)] text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-1"
                    onClick={() => navigate("/roster/create")}
                >
                    Create group
                    <img src="/icons/course/arrow-right-v2.png" alt="arrow-right" />
                </button>
            </div>
            <div className={styles.horizontalDivider}></div>
            <div className="p-6 flex gap-10">
                <div className="w-2/3">
                    {/* Group Name */}
                    <div className="relative inline-block text-left">
                        {/* Color Badge + Group Name */}
                        <div className="flex items-center gap-2">
                            {selectedColor ? (
                                <>
                                    {/* Selected group view */}
                                    <div className="flex items-center cursor-pointer gap-1 text-sm font-medium px-2 py-1 rounded-full" 
                                        onClick={() => setDropdownOpen(prev => !prev)}
                                        ref={dropdownRef}
                                    >
                                    <span className="w-5 h-5 rounded-full" style={{ backgroundColor: selectedColor }}></span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-[#2D3748]">Alpha</h2>
                                </>
                                ) : (
                                <>
                                    {/* Placeholder view */}
                                    <div className="flex items-center gap-1 bg-[#E2E8F0] cursor-pointer text-[rgba(160,174,192,1)] text-sm font-medium px-2 py-1 rounded-full" 
                                        onClick={() => setDropdownOpen(prev => !prev)}
                                        ref={dropdownRef}
                                    >
                                    <span className="w-2 h-2 rounded-full bg-[rgba(160,174,192,1)] cursor-pointer"></span>
                                    Color
                                    </div>
                                    <h2 className="text-2xl font-bold text-[rgba(160,174,192,1)]">Enter a Group Name</h2>
                                </>
                            )}
                        </div>

                        {/* Color Picker Dropdown */}
                        {dropdownOpen && (
                            <div onClick={() => setDropdownOpen(false)} className="absolute mt-1 p-3 w-50 bg-white shadow-lg rounded-lg z-10">
                                <h2 className="text-sm font-medium text-[#2D3748] mb-2">Group Color</h2>
                                <div className="grid grid-cols-6 gap-2 z-10">
                                    {groupColors.map((color, index) => (
                                        <div
                                            key={index}
                                            className="w-6 h-6 rounded-full cursor-pointer relative border border-white hover:ring-2 ring-offset-1"
                                            style={{ backgroundColor: color }}
                                            onClick={() => setSelectedColor(color)}
                                        >
                                            {selectedColor === color && (
                                                <img
                                                    src="/icons/roster/checked.png"
                                                    alt="selected"
                                                    className="absolute inset-0 w-full h-full p-1"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                {/* Students Count and Search */}
                <div className="flex justify-between items-center mb-4">
                    {/* Left Section: Students Count and Search */}
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-[#2D3748]">Students 60</span>
                        <div className="h-5 w-px bg-[#CBD5E0]" />
                        <div className="flex items-center gap-1 text-[#A0AEC0]">
                        {/* Search Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="text-sm bg-transparent placeholder-[#A0AEC0] text-[#2D3748] outline-none"
                        />
                        </div>
                    </div>

                    {/* Right Section: Auto Assign Toggle */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-[#2D3748]">Auto Assign</span>
                        <div
                            className={`relative inline-block w-14 h-6 rounded-full transition duration-200 ease-in cursor-pointer ${
                                isAutoAssign ? 'bg-[rgba(86,111,232,1)]' : 'bg-[#CBD5E0]'
                            }`}
                            onClick={() => setIsAutoAssign(!isAutoAssign)}
                        >
                            <div
                            className={`absolute top-0 left-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in ${
                                isAutoAssign ? 'translate-x-8' : ''
                            }`}
                            />
                        </div>
                    </div>
                </div>
                {/* Students List */}
                <div className="grid grid-cols-3 gap-3">
                    {students.map((student, index) => (
                        <div
                            key={index}
                            onClick={() => toggleAssign(index)}
                            className={`flex relative items-center gap-2 p-3 rounded-md cursor-pointer border hover:bg-blue-50 ${
                            assigned.includes(index) ? 'border-[rgba(86,111,232,1)]' : 'border-gray-300'
                        }`}
                        >
                            <img src={student.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
                            <span>{student.name}</span>
                            {assigned.includes(index) && (
                                <img
                                    src="/icons/roster/checkmark.png"
                                    alt="checkmark"
                                    className="absolute top-[-10px] right-[-10px] w-5 h-5"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

                <div className="w-1/3">
                    <div className="flex justify-between items-center mb-2">
                    <h2 className="text-[20px] font-medium text-[#2D3748] flex items-center gap-2">
                        Assigned Student
                        <span className="text-sm bg-[#E2E8F0] text-[#4A5568] px-2 py-0.5 rounded-md">{assigned.length}</span>
                    </h2>
                    <button onClick={unselectAll} className="text-[rgba(86,111,232,1)] text-medium cursor-pointer">Unselect All</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                    {assigned.map(index => (
                        <div key={index} className="flex items-center gap-2 bg-[rgba(226,232,240,1)] px-3 py-1 rounded-full">
                            <img src={students[index].avatar} alt="avatar" className="w-6 h-6 rounded-full" />
                            <span className="text-sm">{students[index].name}</span>
                            <button onClick={() => toggleAssign(index)} className="text-[rgba(45,55,72,1)] text-xs font-bold cursor-pointer">✕</button>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateGroup;