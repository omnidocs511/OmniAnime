/**
 * AnimeCard — displays an anime poster with hover overlay.
 * Responsive: fluid widths, touch-friendly on mobile.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Users, Play, Tv } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { AnimeMedia } from '@/lib/types';

interface Props {
  anime: AnimeMedia;
  index?: number;
}

export default function AnimeCard({ anime, index = 0 }: Props) {
  const title = anime.title.english || anime.title.userPreferred || anime.title.romaji || '';
  const img = anime.coverImage.extraLarge || anime.coverImage.large;
  const score = anime.averageScore;
  const eps = anime.episodes;
  const format = anime.format;
  const pop = anime.popularity;
  const season = anime.seasonYear;
  const startMonth = anime.startDate?.month;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabel = startMonth ? months[startMonth - 1] : 'April';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
    >
      <Link
        to={`/anime/${anime.id}`}
        className="group block relative w-[130px] xs:w-[140px] sm:w-[155px] md:w-[165px] lg:w-[175px] card-glow rounded-lg overflow-hidden"
      >
        {/* Poster */}
        <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-bg-card">
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Hover overlay — hidden on touch devices via group-hover */}
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-3">
            <p className="text-xs sm:text-sm font-semibold text-white leading-tight line-clamp-2 mb-1 sm:mb-1.5">
              {title}
            </p>

            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] sm:text-[11px] text-gray-300">
              {format && (
                <span className="flex items-center gap-0.5">
                  <Tv size={9} />
                  {format}
                </span>
              )}
              {eps && (
                <span className="flex items-center gap-0.5">
                  <Play size={9} />
                  {eps} eps
                </span>
              )}
              {score && (
                <span className="flex items-center gap-0.5">
                  <Star size={9} className="fill-yellow-400 text-yellow-400" />
                  {(score / 10).toFixed(1)}
                </span>
              )}
              {pop && (
                <span className="flex items-center gap-0.5">
                  <Users size={9} />
                  {formatNumber(pop)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Title below card */}
        <div className="mt-1.5 sm:mt-2 px-0.5">
          <p className="text-[11px] sm:text-[13px] font-medium text-text-primary leading-tight line-clamp-2 group-hover:text-accent-purple transition-colors">
            {title}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-text-muted">
            {season && <span>{monthLabel} {season}</span>}
            {format && <span>{format}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
