import React, { useRef, useEffect } from 'react';
import { useAuth } from "../../../contexts/AuthContext.js";
import axios from "axios";

export default function GroupMenu( {group, setMenuOpen, groupId} ) {
  const menuRef = useRef(null);
  const { user } = useAuth();
  const VITE_GROUPING_API_DOMAIN = import.meta.env.VITE_GROUPING_API_DOMAIN_NAME;

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClick = async (item) => {
    if (item === "Delete Group") {
      const confirm = window.confirm("Are you sure you want to delete this group?");
      if (!confirm) return;
      const response = await axios.delete(`${VITE_GROUPING_API_DOMAIN}/grouping/delete/${groupId}`, {
        headers: {
          "token": user.accessToken
        }
      });
      window.location.reload();
    }
  }

  return (
    <div
    ref={menuRef}
    className="absolute right-[-1.5px] top-7 w-40 rounded-md border border-[#E2E8F0] shadow-lg bg-white ring-opacity-5 z-10"
    >
        <div className="py-1">
            {group.map((item, index) => (
                <button onClick = {() => {
                    handleClick(item);
                }} key={index} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                {item}
                </button>
            ))}    
        </div>
    </div>
  );
}
