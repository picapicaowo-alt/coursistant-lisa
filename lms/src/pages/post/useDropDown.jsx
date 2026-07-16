import {useEffect, useRef, useState} from "react";

export const useDropdown = () => {
  const ref = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return {ref, isOpen, toggle, close};
};