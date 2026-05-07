/**
 * WatchEpisodeList — episode selector panel for the watch page.
 * Shows a grid of episode numbers with the current one highlighted,
 * a range dropdown for long series, and a search filter.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, Play } from 'lucide-react';
import type { StreamEpisode } from '@/lib/types';

interface Props {
  episodes: StreamEpisode[];
  currentEpisode: number;
  onSelect: (ep: number) => void;
  totalEpisodes?: number;
}

const RANGE_SIZE = 50;

export default function WatchEpisodeList({ episodes, currentEpisode, onSelect, totalEpisodes }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [rangeStart, setRangeStart] = useState(() => {
    // Auto-select range that contains current episode
    return Math.floor((currentEpisode - 1) / RANGE_SIZE) * RANGE_SIZE;
  });
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showRangeDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRangeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRangeDropdown]);

  const total = totalEpisodes || episodes.length;
  const hasRanges = total > RANGE_SIZE;

  // Build ranges
  const ranges = useMemo(() => {
    if (!hasRanges) return [];
    const result = [];
    for (let i = 0; i < total; i += RANGE_SIZE) {
      result.push({ start: i, end: Math.min(i + RANGE_SIZE - 1, total - 1) });
    }
    return result;
  }, [total, hasRanges]);

  // Filter and slice episodes for current range
  const visibleEpisodes = useMemo(() => {
    let eps = episodes;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      eps = eps.filter(
        (ep) =>
          ep.number.toString().includes(q) ||
          ep.title?.toLowerCase().includes(q),
      );
    } else if (hasRanges) {
      eps = eps.filter(
        (ep) => ep.number >= rangeStart + 1 && ep.number <= rangeStart + RANGE_SIZE,
      );
    }

    return eps;
  }, [episodes, searchQuery, rangeStart, hasRanges]);

  return (
    <div className="bg-bg-card rounded-xl border border-border-default">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-border-default relative z-10">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Play size={14} className="text-accent-purple" />
            Episodes
            <span className="text-text-muted font-normal text-xs">({total})</span>
          </h3>

          {/* Range selector */}
          {hasRanges && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-border-default text-xs text-text-secondary hover:text-white hover:border-border-hover transition-colors hover:cursor-pointer"
              >
                {rangeStart + 1}-{Math.min(rangeStart + RANGE_SIZE, total)}
                <ChevronDown size={12} className={`transition-transform ${showRangeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showRangeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full right-0 mt-1 py-1 min-w-[120px] rounded-lg bg-bg-secondary border border-border-default shadow-2xl shadow-black/50 z-50 max-h-60 overflow-y-auto"
                >
                  {ranges.map((r) => (
                    <button
                      key={r.start}
                      onClick={() => {
                        setRangeStart(r.start);
                        setShowRangeDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs transition-colors hover:cursor-pointer ${
                        rangeStart === r.start
                          ? 'text-accent-purple bg-accent-purple/10'
                          : 'text-text-secondary hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {r.start + 1} – {r.end + 1}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg-primary border border-border-default focus-within:border-accent-purple/40 transition-colors">
          <Search size={12} className="text-text-muted shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search episode..."
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none min-w-0"
          />
        </div>
      </div>

      {/* Episode grid */}
      <div className="p-2.5 sm:p-3 max-h-[400px] lg:max-h-[500px] overflow-y-auto">
        {visibleEpisodes.length > 0 ? (
          <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
            {visibleEpisodes.map((ep) => {
              const isCurrent = ep.number === currentEpisode;
              return (
                <button
                  key={ep.id || ep.number}
                  onClick={() => onSelect(ep.number)}
                  title={ep.title || `Episode ${ep.number}`}
                  className={`relative px-1 py-2 rounded-lg text-xs font-medium transition-all hover:cursor-pointer ${
                    isCurrent
                      ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/25 ring-1 ring-accent-purple/50'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white border border-transparent hover:border-border-hover'
                  }`}
                >
                  {ep.number}
                  {isCurrent && (
                    <motion.div
                      layoutId="current-ep"
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-green"
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-text-muted text-xs py-8">No episodes found.</p>
        )}
      </div>
    </div>
  );
}
