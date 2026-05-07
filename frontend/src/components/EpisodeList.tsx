/**
 * EpisodeList — expandable episode list with thumbnails, titles, synopses, and air dates.
 * Fully responsive: compact cards on mobile, full rows on desktop.
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Search, Play, ArrowUpDown, ListFilter } from 'lucide-react';
import { formatAiredDate } from '@/lib/utils';
import type { Episode, NextAiringEpisode } from '@/lib/types';

interface Props {
  episodes: Episode[];
  nextAiring: NextAiringEpisode | null;
  animeTitle: string;
  animeId?: number;
  totalEpisodes: number | null;
  loading?: boolean;
}

const RANGE_SIZE = 50;

export default function EpisodeList({ episodes, nextAiring, animeTitle, animeId, totalEpisodes, loading }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [rangeStart, setRangeStart] = useState(0);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showSortDropdown && sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
      if (showRangeDropdown && rangeRef.current && !rangeRef.current.contains(e.target as Node)) {
        setShowRangeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSortDropdown, showRangeDropdown]);

  // Jikan episode data can lag behind AniList's nextAiringEpisode.
  // If AniList says "Episode 5 airing soon", episodes 1-4 should exist.
  // Fill in placeholders for any missing ones.
  const airedCount = nextAiring ? nextAiring.episode - 1 : (totalEpisodes || episodes.length);
  const completeEpisodes: Episode[] = [];

  for (let i = 0; i < Math.max(episodes.length, airedCount); i++) {
    if (i < episodes.length) {
      completeEpisodes.push(episodes[i]);
    } else {
      completeEpisodes.push({
        mal_id: -(i + 1),
        title: `Episode ${i + 1}`,
        title_japanese: null,
        aired: null,
      } as Episode);
    }
  }

  const total = completeEpisodes.length;
  const hasRanges = total > RANGE_SIZE;

  // Build range options
  const ranges = hasRanges
    ? Array.from({ length: Math.ceil(total / RANGE_SIZE) }, (_, i) => ({
        start: i * RANGE_SIZE,
        end: Math.min((i + 1) * RANGE_SIZE, total),
      }))
    : [];

  // Filter by search
  const filtered = searchQuery
    ? completeEpisodes.filter(
      (ep) =>
        ep.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.title_japanese?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : completeEpisodes;

  // Apply range (only when not searching)
  const ranged = searchQuery
    ? filtered
    : hasRanges
      ? filtered.slice(rangeStart, rangeStart + RANGE_SIZE)
      : filtered;

  // Apply sort
  const sorted = sortOrder === 'desc' ? [...ranged].reverse() : ranged;

  return (
    <section className="mt-6 sm:mt-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg font-bold text-white hover:text-accent-purple transition-colors hover:cursor-pointer"
        >
          Episodes
          {expanded ? <ChevronUp size={16} className="sm:w-[18px] sm:h-[18px]" /> : <ChevronDown size={16} className="sm:w-[18px] sm:h-[18px]" />}
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Range dropdown */}
          {hasRanges && (
            <div ref={rangeRef} className="relative">
              <button
                onClick={() => { setShowRangeDropdown(!showRangeDropdown); setShowSortDropdown(false); }}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-white/5 border border-border-default text-xs text-text-secondary hover:text-white hover:border-border-hover transition-colors hover:cursor-pointer"
              >
                <ListFilter size={12} />
                <span>{rangeStart + 1}-{Math.min(rangeStart + RANGE_SIZE, total)}</span>
                <ChevronDown size={10} className={`transition-transform ${showRangeDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showRangeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full right-0 mt-1 py-1 min-w-[120px] rounded-lg bg-bg-secondary border border-border-default shadow-2xl shadow-black/50 z-50 max-h-60 overflow-y-auto"
                  >
                    {ranges.map((r) => (
                      <button
                        key={r.start}
                        onClick={() => { setRangeStart(r.start); setShowRangeDropdown(false); }}
                        className={`w-full px-3 py-1.5 text-left text-xs transition-colors hover:cursor-pointer ${
                          rangeStart === r.start
                            ? 'text-accent-purple bg-accent-purple/10'
                            : 'text-text-secondary hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {r.start + 1} – {r.end}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Sort order dropdown */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => { setShowSortDropdown(!showSortDropdown); setShowRangeDropdown(false); }}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-white/5 border border-border-default text-xs text-text-secondary hover:text-white hover:border-border-hover transition-colors hover:cursor-pointer"
            >
              <ArrowUpDown size={12} />
              <span className="hidden sm:inline">
                {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
              </span>
              <ChevronDown size={10} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showSortDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-1 py-1 min-w-[140px] rounded-lg bg-bg-secondary border border-border-default shadow-2xl shadow-black/50 z-50"
                >
                  <button
                    onClick={() => { setSortOrder('asc'); setShowSortDropdown(false); }}
                    className={`w-full px-3 py-1.5 text-left text-xs transition-colors hover:cursor-pointer flex items-center gap-2 ${
                      sortOrder === 'asc'
                        ? 'text-accent-purple bg-accent-purple/10'
                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Oldest First
                  </button>
                  <button
                    onClick={() => { setSortOrder('desc'); setShowSortDropdown(false); }}
                    className={`w-full px-3 py-1.5 text-left text-xs transition-colors hover:cursor-pointer flex items-center gap-2 ${
                      sortOrder === 'desc'
                        ? 'text-accent-purple bg-accent-purple/10'
                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Newest First
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Search within episodes */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg bg-bg-card border border-border-default">
              <Search size={12} className="text-text-muted sm:w-3.5 sm:h-3.5" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search episodes..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-text-primary placeholder:text-text-muted outline-none min-w-0"
              />
            </div>

            {/* Episode items */}
            {loading ? (
              <div className="space-y-2 sm:space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg bg-bg-card">
                    <div className="skeleton w-16 sm:w-28 h-10 sm:h-16 rounded shrink-0" />
                    <div className="flex-1 space-y-1.5 sm:space-y-2">
                      <div className="skeleton h-3 sm:h-4 w-3/4 rounded" />
                      <div className="skeleton h-2.5 sm:h-3 w-full rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-1.5 sm:space-y-2">
                {sorted.map((ep) => {
                  const epNumber = completeEpisodes.indexOf(ep) + 1;
                  const inner = (
                    <>
                      {/* Play icon */}
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent-purple/10 flex items-center justify-center shrink-0 group-hover:bg-accent-purple/20 transition-colors">
                        <Play size={12} className="text-accent-purple sm:w-3.5 sm:h-3.5" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-accent-purple transition-colors">
                          {epNumber}. {ep.title || `Episode ${epNumber}`}
                        </p>
                      </div>

                      {/* Air date */}
                      {ep.aired && (
                        <div className="text-[10px] sm:text-xs text-text-muted shrink-0 self-center hidden xs:block">
                          {formatAiredDate(ep.aired)}
                        </div>
                      )}
                    </>
                  );

                  return animeId ? (
                    <Link
                      key={ep.mal_id || epNumber}
                      to={`/watch/${animeId}/${epNumber}`}
                      className="group episode-card flex items-center gap-2.5 sm:gap-4 p-2 sm:p-3 rounded-lg bg-bg-card border border-border-default/50 hover:border-accent-purple/30 transition-colors"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={ep.mal_id || epNumber}
                      className="group episode-card flex items-center gap-2.5 sm:gap-4 p-2 sm:p-3 rounded-lg bg-bg-card border border-border-default/50"
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-text-muted text-xs sm:text-sm py-6 sm:py-8">
                No episodes available yet.
              </div>
            )}

            {/* Next airing info */}
            {nextAiring && (
              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
                <p className="text-xs sm:text-sm text-accent-purple">
                  Episode {nextAiring.episode} airing in{' '}
                  <span className="font-semibold">
                    {Math.floor(nextAiring.timeUntilAiring / 86400)}d{' '}
                    {Math.floor((nextAiring.timeUntilAiring % 86400) / 3600)}h
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
