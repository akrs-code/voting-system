import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4 mt-6 rounded-2xl shadow-sm">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-4 py-2 text-sm font-bold text-[#2f318d] disabled:opacity-30"
        >
          Back
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-4 py-2 text-sm font-bold text-[#2f318d] disabled:opacity-30"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Page <span className="text-[#2f318d] font-bold">{currentPage}</span> of {totalPages}
        </p>
        
        <nav className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 disabled:opacity-20 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          {getPageNumbers().map((page, idx) => (
            <button
              key={idx}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`min-w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                currentPage === page
                  ? 'bg-[#2f318d] text-white shadow-md shadow-indigo-100'
                  : page === '...' 
                    ? 'text-slate-300 cursor-default'
                    : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 disabled:opacity-20 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Pagination;