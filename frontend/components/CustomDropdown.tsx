import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Option {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  icon,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const updateCoords = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideTrigger = dropdownRef.current?.contains(target);
      const isInsideMenu = menuRef.current?.contains(target);
      
      if (!isInsideTrigger && !isInsideMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-12 px-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 transition-all hover:border-[#2f318d] focus:outline-none focus:ring-2 focus:ring-indigo-100",
          isOpen && "border-[#2f318d] ring-2 ring-indigo-100 shadow-sm"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {icon && <span className="text-slate-400 flex-shrink-0">{icon}</span>}
          <span className={cn(
            "text-sm font-semibold truncate",
            selectedOption ? "text-slate-700" : "text-slate-400"
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={18} 
          className={cn("text-slate-400 transition-transform duration-300", isOpen && "rotate-180 text-[#2f318d]")} 
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              ref={menuRef}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: 'absolute',
                top: coords.top + 8,
                left: coords.left,
                width: coords.width,
                zIndex: 9999
              }}
              className="bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 origin-top"
            >
              <div className="max-h-60 overflow-y-auto scrollbar-hide px-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors mb-1 last:mb-0",
                      value === option.value 
                        ? "bg-indigo-50 text-[#2f318d]" 
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>{option.label}</span>
                    {value === option.value && <Check size={16} className="text-[#2f318d]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default CustomDropdown;
