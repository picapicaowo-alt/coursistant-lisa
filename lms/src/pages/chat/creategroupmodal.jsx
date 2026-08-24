import React, { useState } from 'react';
import { X, Users, Clock, Plus, List } from 'lucide-react';
import {RichTextEditor} from '@/components/RichTextEditor';

export default function CreateGroupModal({ isOpen, onClose, onOpenAutoAssign }) {
    const [groupName, setGroupName] = useState('');
    const [studentCount, setStudentCount] = useState('');
    const [joinType, setJoinType] = useState('free');
    const [description, setDescription] = useState('');
    const [autoAssign, setAutoAssign] = useState(false);
  
    if (!isOpen) return null; // <== Don't render modal if not open
    
    const handleAutoAssignToggle = () => {
        if (!autoAssign) {
            // When turning on auto assign, close this modal and open auto assign modal
            onOpenAutoAssign();
        } else {
            // When turning off, just toggle the state
            setAutoAssign(false);
        }
    };

    const handlePublish = () => {
      
      console.log({
        groupName,
        studentCount,
        joinType,
        description,
        autoAssign,
      });
      onClose(); 
    };
  
    return (
        <div className="fixed inset-0 backdrop-blur-[5px] bg-transparent bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-[15px] shadow-xl w-150 mx-4 relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <h2 className="text-[22px] text-gray-600">Create Group</h2>
            <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>
  
          {/* Content */}
          <div className="p-12 pt-2 space-y-6">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter a one line summary, 100 characters or less"
              className="w-full text-lg font-medium text-gray-900 placeholder-gray-400 border-none outline-none resize-none"
              maxLength={100}
            />
  
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 flex-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.33325 1.33398V3.33398" stroke="#A0AEC0" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10.6667 1.33398V3.33398" stroke="#A0AEC0" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2.33325 6.06055H13.6666" stroke="#A0AEC0" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 5.66732V11.334C14 13.334 13 14.6673 10.6667 14.6673H5.33333C3 14.6673 2 13.334 2 11.334V5.66732C2 3.66732 3 2.33398 5.33333 2.33398H10.6667C13 2.33398 14 3.66732 14 5.66732Z" stroke="#A0AEC0" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10.4632 9.13216H10.4692" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10.4632 11.1322H10.4692" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7.99691 9.13216H8.0029" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7.99691 11.1322H8.0029" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5.52962 9.13216H5.53561" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5.52962 11.1322H5.53561" stroke="#A0AEC0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span className="text-[#A0AEC0]">Number of students</span>
                
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={studentCount}
                  onChange={(e) => setStudentCount(e.target.value)}
                  placeholder="Empty"
                  className={`
                    w-[250px] p-2 text-left text-gray-900 rounded-lg outline-none bg-white
                    ${studentCount ? 'border border-[#E2E8F0]' : ''}

                    // Webkit specific styling for spin buttons (Chrome/Safari)
                    [appearance:textfield] 
                    
                    [&::-webkit-inner-spin-button]:bg-white
                    [&::-webkit-inner-spin-button]:w-8
                    [&::-webkit-inner-spin-button]:cursor-pointer
                    [&::-webkit-inner-spin-button]:text-gray-600
                    ${studentCount ? '[&::-webkit-inner-spin-button]:border-l [&::-webkit-inner-spin-button]:border-[#E2E8F0]' : ''}
                    
                    [&::-webkit-outer-spin-button]:bg-white
                    [&::-webkit-outer-spin-button]:w-8
                  `}
                  min="1"
                />
              </div>
            </div>
  
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 flex-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.6663 8.00065C14.6663 11.6807 11.6797 14.6673 7.99967 14.6673C4.31967 14.6673 1.33301 11.6807 1.33301 8.00065C1.33301 4.32065 4.31967 1.33398 7.99967 1.33398C11.6797 1.33398 14.6663 4.32065 14.6663 8.00065Z" stroke="#A0AEC0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10.4729 10.1192L8.40626 8.88586C8.04626 8.67253 7.75293 8.15919 7.75293 7.73919V5.00586" stroke="#A0AEC0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>

                <span className="text-[#A0AEC0]">How to join</span>
              </div>
              <div className="flex items-center space-x-6">
                {['free', 'approval'].map((type) => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="joinType"
                      value={type}
                      checked={joinType === type}
                      onChange={(e) => setJoinType(e.target.value)}
                      className="w-4 h-4 text-[#566FE8] border-gray-300 checked:bg-black"
                    />
                    <span className="text-[#A0AEC0]">
                      {type === 'free' ? 'Free to join' : 'Approval required'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
  
            <div className="space-y-2 border-t border-[#E2E8F0] mt-5 pt-6" >
              <div className="flex space-x-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="15" height="15" rx="2.5" stroke="#E2E8F0"/>
                <path d="M5 8H11" stroke="#2D3748" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 11V5" stroke="#2D3748" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>

              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="4" r="1" fill="#2D3748"/>
                <circle cx="10" cy="4" r="1" fill="#2D3748"/>
                <circle cx="6" cy="8" r="1" fill="#2D3748"/>
                <circle cx="10" cy="8" r="1" fill="#2D3748"/>
                <circle cx="6" cy="12" r="1" fill="#2D3748"/>
                <circle cx="10" cy="12" r="1" fill="#2D3748"/>
              </svg>

                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Type description here ..."
                  ariaLabel="Group description"
              />
              </div>

            </div>
          </div>
  
          {/* Footer */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-3">
              <span className="text-gray-700 ml-[20px]">Auto Assign</span>
              <button
                    onClick={handleAutoAssignToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        autoAssign ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoAssign ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[#2D3748] border border-t border-[#CBD5E0] rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 text-white bg-[#566FE8] rounded-lg hover:bg-[#7F9CF5] transition-colors cursor-pointer"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
