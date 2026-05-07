/**
 * Global search modal with autocomplete, keyboard navigation, and results.
 * Responsive: full-width on mobile, constrained on desktop.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { useSearch } from '@/hooks/useAnime';
import { truncate } from '@/lib/utils';
import type { AnimeMedia } from '@/lib/types';

interface Props {
  onClose: () => void;
}

export default function SearchModal({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useSearch(debouncedQuery, 1, 8);
  const results: AnimeMedia[] = data?.media || [];

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard nav
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIdx]) {
        navigate(`/anime/${results[selectedIdx].id}`);
        onClose();
      }
    },
    [results, selectedIdx, navigate, onClose],
  );

  useEffect(() => {
    setSelectedIdx(0);
  }, [debouncedQuery]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-100 flex items-start justify-center pt-[8vh] sm:pt-[12vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl mx-3 sm:mx-4 rounded-xl bg-bg-secondary border border-border-default shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border-default">
          <Search size={16} className="text-text-muted shrink-0 sm:w-[18px] sm:h-[18px]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search anime..."
            className="flex-1 bg-transparent text-sm sm:text-base text-text-primary placeholder:text-text-muted outline-none min-w-0"
          />
          {isLoading && <Loader2 size={14} className="text-accent-purple animate-spin sm:w-4 sm:h-4" />}
          <button onClick={onClose} className="p-1 rounded hover:cursor-pointer hover:bg-white/10 transition-colors">
            <X size={14} className="text-text-muted sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-[55vh] sm:max-h-[50vh] overflow-y-auto py-1 sm:py-2">
            {results.map((anime, idx) => (
              <button
                key={anime.id}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-left transition-colors hover:cursor-pointer ${
                  idx === selectedIdx ? 'bg-accent-purple/10' : 'hover:bg-white/5'
                }`}
                onClick={() => {
                  navigate(`/anime/${anime.id}`);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                <img
                  src={anime.coverImage.medium}
                  alt=""
                  className="w-8 h-12 sm:w-10 sm:h-14 rounded object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-text-primary truncate">
                    {anime.title.english || anime.title.userPreferred || anime.title.romaji}
                  </p>
                  <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">
                    {anime.format} • {anime.seasonYear || ''} • {anime.averageScore ? `★ ${anime.averageScore}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {debouncedQuery.length > 0 && !isLoading && results.length === 0 && (
          <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-text-muted text-xs sm:text-sm">
            No results found for "<span className="text-text-primary">{debouncedQuery}</span>"
          </div>
        )}

        {/* Hint */}
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-t border-border-default flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-text-muted">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
