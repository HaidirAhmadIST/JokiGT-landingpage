'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  total: number;
  perPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  label?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  total,
  perPage,
  lastPage,
  onPageChange,
  label = 'data',
  className,
}: PaginationProps) {
  const start = total > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const end = Math.min(currentPage * perPage, total);

  return (
    <div className={cn("px-6 py-4 border-t border-slate-100 flex items-center justify-between mt-2 bg-white", className)}>
      <p className="text-sm font-medium text-slate-500">
        Menampilkan <span className="text-slate-900 font-bold">{start}-{end}</span> dari <span className="text-slate-900 font-bold">{total}</span> {label}
      </p>
      
      <div className="flex items-center gap-6">
        <Button 
          variant="outline" 
          size="icon" 
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 shadow-sm transition-all active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-1.5 min-w-[100px] justify-center">
          <span className="text-sm font-bold text-slate-900">Halaman {currentPage}</span>
          <span className="text-sm text-slate-400">dari {lastPage}</span>
        </div>

        <Button 
          variant="outline" 
          size="icon"
          disabled={currentPage === lastPage || total === 0}
          onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
          className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 shadow-sm transition-all active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
