/**
 * HeroBanner — rotating featured anime banner matching the OmniAnime homepage.
 * Shows large cover art with overlay gradient, anime info, and navigation dots.
 * Fully responsive: compact on mobile, expanded on desktop.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Star, Users, Tv } from 'lucide-react';
import { formatNumber, truncate, stripHtml } from '@/lib/utils';
import type { AnimeMedia } from '@/lib/types';

interface Props {
  items: AnimeMedia[];
}

export default function HeroBanner({ items }: Props) {
  const [current, setCurrent] = useState(0);
  const total = items.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    const t = setInterval(next, 8000);
    return () => clearInterval(t);
  }, [next]);

  if (!items.length) return null;

  const anime = items[current];
  const banner = anime.bannerImage || anime.coverImage.extraLarge;
  const desc = anime.description ? stripHtml(anime.description) : '';
  // Shorter description on mobile
  const mobileDesc = desc ? truncate(desc, 120) : '';
  const desktopDesc = desc ? truncate(desc, 300) : '';

  return (
    <div className="relative w-full h-[280px] xs:h-[340px] sm:h-[420px] md:h-[460px] lg:h-[500px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={anime.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {/* Background image */}
          <img
            src={banner}
            alt=""
            className="w-full h-full object-cover object-center"
          />

          {/* Left gradient overlay */}
          <div className="absolute inset-0 hero-gradient" />

          {/* Bottom gradient */}
          <div className="absolute inset-0 hero-gradient-bottom" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-10 sm:pb-14 md:pb-16 px-4 sm:px-8 md:px-12 lg:px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={anime.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-[90%] sm:max-w-lg md:max-w-xl"
          >
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white leading-tight mb-3 sm:mb-2 line-clamp-2">
              {anime.title.english || anime.title.userPreferred}
            </h2>

            {/* Description — hidden on very small screens, short on mobile, long on desktop */}
            {desc && (
              <>
                <p className="hidden sm:block md:hidden text-xs sm:text-sm text-text-secondary leading-relaxed mb-3 line-clamp-3">
                  {mobileDesc}
                </p>
                <p className="hidden md:block text-sm text-text-secondary leading-relaxed mb-4 max-w-lg">
                  {desktopDesc}
                </p>
              </>
            )}

            {/* Metadata badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm text-text-secondary mb-3 sm:mb-4">
              {anime.episodes && (
                <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-white/10">
                  <Play size={10} className="sm:w-3 sm:h-3" />
                  <span className="hidden xs:inline">{anime.episodes} episodes</span>
                  <span className="xs:hidden">{anime.episodes} ep</span>
                </span>
              )}
              {anime.averageScore && (
                <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-white/10">
                  <Star size={10} className="fill-yellow-400 text-yellow-400 sm:w-3 sm:h-3" />
                  {anime.averageScore} / 100
                </span>
              )}
              {anime.popularity && (
                <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-white/10">
                  <Users size={10} className="sm:w-3 sm:h-3" />
                  {formatNumber(anime.popularity)}
                </span>
              )}
              {anime.format && (
                <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-white/10">
                  <Tv size={10} className="sm:w-3 sm:h-3" />
                  {anime.format}
                </span>
              )}
            </div>

            <Link
              to={`/anime/${anime.id}`}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold text-xs sm:text-sm transition-all hover:shadow-lg hover:shadow-accent-purple/30 hover:cursor-pointer"
            >
              View Details
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows — larger touch targets on mobile */}
      <button
        onClick={prev}
        className="absolute left-2 hidden sm:block sm:left-3 top-1/2 hover:cursor-pointer -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
        aria-label="Previous"
      >
        <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 hidden sm:block sm:right-3 top-1/2 hover:cursor-pointer -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-sm"
        aria-label="Next"
      >
        <ChevronRight size={20} className="sm:w-6 sm:h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 sm:h-2 hover:cursor-pointer rounded-full transition-all ${i === current
              ? 'bg-accent-purple w-4 sm:w-6'
              : 'w-1.5 sm:w-2 bg-white/30 hover:bg-white/50'
              }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
