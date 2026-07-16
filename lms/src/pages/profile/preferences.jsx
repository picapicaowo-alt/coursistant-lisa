import React from "react";
import { useNavigate } from 'react-router-dom';

export default function Preferences() {
  const navigate = useNavigate();
  return (
    <div className="w-[90%] mx-auto mt-8">
      {/* Language */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[22px] text-black-600 mb-1">
            <span className="text-[22px]">Language</span>
          </div>
          <div className="text-gray-400 text-base">Set your app's language</div>
        </div>
        <div>
          <button className="flex items-center border border-[#CBD5E0] rounded-lg px-3 py-1.5 text-gray-700 text-base font-medium">
            <span className="mr-2"> <img src="/icons/profile/language.png" alt="lang" className="w-4 h-4 inline-block align-middle" /> </span>
            English
            <svg className="ml-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcut */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[22px] text-black-600 mb-1">Keyboard Shortcut</div>
          <div className="text-gray-400 text-base">Enable or customize shortcuts</div>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle */}
          <button className="w-12 h-6 flex items-center bg-blue-500 rounded-full p-1 transition-colors duration-300 focus:outline-none">
            <span className="w-5 h-5 bg-white rounded-full shadow transform translate-x-6" />
          </button>
          {/* Settings icon */}
          <button className="border border-[#CBD5E0] rounded-lg p-2 hover:bg-gray-100 bg-transparent cursor-pointer" onClick={() => navigate('/settings')}>
            <img src="/icons/profile/setting.png" alt="settings" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Interface Theme */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[22px] text-black-600 mb-1">Interface theme</div>
            <div className="text-gray-400 text-lg leading-tight">Select or customize your UI theme.</div>
          </div>
          <div className="flex items-center border border-gray-300 rounded-2xl overflow-hidden p-1">
            <button className="px-3 py-2 bg-[#CBD5E0] text-[#384152] font-medium text-sm rounded-2xl focus:outline-none">Packet Panel Theme</button>
            <button className="px-3 py-2 text-[#384152] font-sm text-sm bg-transparent focus:outline-none">Custom Theme</button>
          </div>
        </div>
        {/* Theme Cards */}
        <div className="flex gap-6">
          {/* System Theme */}
          <div className="flex flex-col bg-white rounded-2xl shadow-md border border-gray-100 w-88 h-auto overflow-hidden">
            <img src="/icons/profile/system_theme.png" alt="System Theme" className="w-full object-cover mb-2 rounded-t-2xl" />
            <div className="flex flex-col p-2">
              <div className="text-base text-gray-700 font-medium mb-2 pl-3 text-left w-full">System</div>
            </div>
          </div>
          {/* Light Theme */}
          <div className="flex flex-col items-center bg-white rounded-2xl shadow-md border border-gray-100 w-88 h-auto overflow-hidden">
            <img src="/icons/profile/light_theme.png" alt="Light Theme" className="w-full object-cover mb-2" />
            <div className="text-base text-gray-700 font-medium mt-2 pl-5 text-left w-full">Light</div>
          </div>
          {/* Dark Theme */}
          <div className="flex flex-col items-center bg-white rounded-2xl shadow-md border border-gray-100 w-88 h-auto overflow-hidden">
            <img src="/icons/profile/dark_theme.png" alt="Dark Theme" className="w-full object-cover mb-2" />
            <div className="text-base text-gray-700 font-medium mt-2 pl-5 text-left w-full">Dark</div>
          </div>
        </div>
      </div>
    </div>
  );
} 