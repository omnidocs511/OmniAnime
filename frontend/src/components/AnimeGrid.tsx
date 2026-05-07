/**
 * AnimeGrid — a horizontal scrollable row of AnimeCards with section heading.
 * Responsive: fluid padding, touch-scroll on mobile, scroll buttons on desktop.
 */

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimeCard from './AnimeCard';
import type { AnimeMedia } from '@/lib/types';

interface Props {
  title: string;
  items: AnimeMedia[];
  loading?: boolean;
}

export default function AnimeGrid({ title, items, loading }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.clientWidth;
    const amount = dir === 'left' ? -(w * 0.75) : (w * 0.75);
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="mb-6 sm:mb-8 md:mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 px-4 sm:px-8 md:px-12 lg:px-16">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">{title}</h2>
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-colors hover:cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-colors hover:cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="scroll-section hide-scrollbar ml-4 sm:ml-8 md:ml-8 lg:ml-16 px-4 sm:px-8 md:px-12 lg:px-16 gap-3 sm:gap-4"
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-[130px] xs:w-[140px] sm:w-[155px] md:w-[165px] lg:w-[175px] shrink-0">
              <div className="skeleton aspect-2/3 rounded-lg" />
              <div className="skeleton h-3 sm:h-4 w-3/4 mt-1.5 sm:mt-2 rounded" />
              <div className="skeleton h-2.5 sm:h-3 w-1/2 mt-1 rounded" />
            </div>
          ))
          : items.map((anime, i) => (
            <AnimeCard key={anime.id} anime={anime} index={i} />
          ))}
      </div>
    </section>
  );
}
