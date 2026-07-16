import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function AutoAssignModal({ isOpen, onClose, onAssign }) {
    const [groupSize, setGroupSize] = useState('');
    const [strategy, setStrategy] = useState('Completely random');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    if (!isOpen) return null;

    const strategies = ['Completely random', 'Balanced grades', 'Mixed majors'];

    const handleAssign = () => {
        console.log({ groupSize, strategy });
        onAssign();
    };

    return (
        <div className="fixed inset-0 backdrop-blur-[5px] bg-transparent bg-opacity-30 flex items-center justify-center z-50 ">
            <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6">
                    <h2 className="text-xl text-gray-600">Auto Assign</h2>
                    <button 
                        onClick={onClose}
                        className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6" >
                    <div className="grid grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Group Number of people
                            </label>
                            <input 
                                type="text" 
                                value={groupSize}
                                onChange={(e) => setGroupSize(e.target.value)}
                                placeholder="Enter" 
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm"
                            />
                        </div>
                        
                        {/* Right Column */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-3 ">
                                Grouping strategy
                            </label>
                            <div className="relative">
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="cursor-pointer w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none appearance-none bg-white text-left text-sm text-gray-900 flex items-center justify-between"
                                >
                                    <span className="text-[#2D3748]">{strategy}</span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Dropdown Options */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                                    <div className="py-1">
                                        {strategies.map((option) => (
                                            <div 
                                                key={option}
                                                onClick={() => {
                                                    setStrategy(option);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer"
                                            >
                                                {option}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 mt-[75px] mb-3">
                    <button 
                        onClick={onClose}
                        className="cursor-pointer px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleAssign}
                        className="cursor-pointer px-6 py-2 text-sm font-medium text-white bg-[#566FE8] rounded-md hover:bg-[#7F9CF5] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                        Assign
                    </button>
                </div>
            </div>
        </div>
    );
}