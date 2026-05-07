/**
 * BrowsePage — Grid-based anime discovery with category tabs and genre filtering.
 */

import { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Play, Tv, Users, Filter, TrendingUp, Flame, Calendar, Award, ChevronDown, X, Tag, Loader2 } from 'lucide-react';
import { useInfiniteAnime } from '@/hooks/useAnime';
import { getCurrentSeason, formatNumber } from '@/lib/utils';
import type { AnimeMedia } from '@/lib/types';

type Category = 'trending' | 'popular' | 'top-airing' | 'seasonal';

const categories: { key: Category; label: string; icon: React.ReactNode }[] = [
  { key: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
  { key: 'top-airing', label: 'Top Airing', icon: <Flame size={14} /> },
  { key: 'seasonal', label: 'This Season', icon: <Calendar size={14} /> },
  { key: 'popular', label: 'All-Time Popular', icon: <Award size={14} /> },
];

const ALL_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy',
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
  'Thriller',
];

function BrowseCard({ anime, index }: { anime: AnimeMedia; index: number }) {
  const title = anime.title.english || anime.title.userPreferred || anime.title.romaji || '';
  const img = anime.coverImage.extraLarge || anime.coverImage.large;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
    >
      <Link
        to={`/anime/${anime.id}`}
        className="group block rounded-xl overflow-hidden bg-bg-card border border-border-default hover:border-accent-purple/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent-purple/5"
      >
        {/* Cover image */}
        <div className="relative aspect-3/4 overflow-hidden">
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Score badge */}
          {anime.averageScore && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] sm:text-xs font-medium text-white">
              <Star size={10} className="fill-yellow-400 text-yellow-400" />
              {(anime.averageScore / 10).toFixed(1)}
            </div>
          )}

          {/* Status badge */}
          {anime.status === 'RELEASING' && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-accent-green/90 text-[9px] sm:text-[10px] font-semibold text-white uppercase tracking-wider">
              Airing
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-3">
          <h3 className="text-xs sm:text-sm font-semibold text-text-primary leading-tight line-clamp-2 group-hover:text-accent-purple transition-colors">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 text-[10px] sm:text-[11px] text-text-muted">
            {anime.format && (
              <span className="flex items-center gap-0.5">
                <Tv size={9} />
                {anime.format}
              </span>
            )}
            {anime.episodes && (
              <span className="flex items-center gap-0.5">
                <Play size={9} />
                {anime.episodes} ep
              </span>
            )}
            {anime.popularity && (
              <span className="flex items-center gap-0.5">
                <Users size={9} />
                {formatNumber(anime.popularity)}
              </span>
            )}
          </div>
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {anime.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded bg-white/5 text-text-muted border border-border-default"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function BrowsePage() {
  const [activeCategory, setActiveCategory] = useState<Category>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { season, year } = getCurrentSeason();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isSearching = searchQuery.length > 0;
  const isGenreFilter = selectedGenre.length > 0;

  let hookCategory: 'trending' | 'top-airing' | 'seasonal' | 'popular' | 'search' | 'genre' = activeCategory;
  let hookParams: any = { perPage: 30 };

  if (isSearching) {
    hookCategory = 'search';
    hookParams = { query: searchQuery, genre: selectedGenre, perPage: 30 };
  } else if (isGenreFilter) {
    hookCategory = 'genre';
    hookParams = { genre: selectedGenre, perPage: 30 };
  } else if (activeCategory === 'seasonal') {
    hookParams = { season, year, perPage: 30 };
  }

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteAnime(hookCategory, hookParams);

  const currentItems = data?.pages.flatMap((page: any) => page.media) || [];

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <Helmet>
        <title>Browse Anime - OmniAnime</title>
        <meta name="description" content="Browse and discover anime across trending, popular, seasonal, and top airing categories." />
      </Helmet>

      <main className="pt-14 pb-8">
        {/* Hero header */}
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-b from-accent-purple/5 via-transparent to-transparent" />
          <div className="relative px-4 sm:px-8 md:px-12 lg:px-16 pt-8 sm:pt-12 pb-6 sm:pb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2"
            >
              Browse Anime
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm sm:text-base text-text-secondary max-w-xl"
            >
              Discover your next favorite anime across trending, seasonal, and all-time popular titles.
            </motion.p>

            {/* Search + Genre filter row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3 max-w-2xl"
            >
              {/* Search input */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-bg-card border border-border-default focus-within:border-accent-purple/50 transition-colors flex-1">
                <Filter size={14} className="text-text-muted shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none min-w-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] text-text-muted hover:text-white px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors hover:cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Genre dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all hover:cursor-pointer w-auto ${
                    selectedGenre
                      ? 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple'
                      : 'bg-bg-card border-border-default text-text-secondary hover:border-border-hover'
                  }`}
                >
                  <Tag size={14} className="shrink-0" />
                  <span className="text-sm whitespace-nowrap">
                    {selectedGenre || 'All Genres'}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform ${genreDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {genreDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 sm:left-0 mt-2 w-64 sm:w-72 rounded-xl bg-bg-secondary border border-border-default shadow-2xl shadow-black/40 z-50 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-default">
                        <span className="text-xs font-semibold text-white">Select Genre</span>
                        {selectedGenre && (
                          <button
                            onClick={() => {
                              setSelectedGenre('');
                              setGenreDropdownOpen(false);
                            }}
                            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-accent-purple transition-colors hover:cursor-pointer"
                          >
                            <X size={10} />
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Genre grid */}
                      <div className="max-h-64 overflow-y-auto p-2 grid grid-cols-2 gap-1">
                        {ALL_GENRES.map((genre) => (
                          <button
                            key={genre}
                            onClick={() => {
                              setSelectedGenre(genre === selectedGenre ? '' : genre);
                              setGenreDropdownOpen(false);
                            }}
                            className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:cursor-pointer ${
                              genre === selectedGenre
                                ? 'bg-accent-purple text-white'
                                : 'text-text-secondary hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Active Filters */}
        {(isSearching || isGenreFilter) && (
          <div className="px-4 sm:px-8 md:px-12 lg:px-16 mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-text-muted">Showing results for:</span>
              
              {isSearching && (
                <span className="text-sm text-white font-medium">"{searchQuery}"</span>
              )}
              
              {isSearching && isGenreFilter && (
                <span className="text-sm text-text-muted">in</span>
              )}

              {isGenreFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-purple/15 text-accent-purple text-xs sm:text-sm font-medium border border-accent-purple/20">
                  <Tag size={12} />
                  {selectedGenre}
                  <button
                    onClick={() => setSelectedGenre('')}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-accent-purple/20 transition-colors hover:cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}

              <span className="text-xs text-text-muted ml-1">
                ({isLoading ? '...' : currentItems.length})
              </span>
            </div>
          </div>
        )}

        {/* Category tabs — hidden when genre or search is active */}
        {!isSearching && !isGenreFilter && (
          <div className="px-4 sm:px-8 md:px-12 lg:px-16 mb-6 sm:mb-8">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all hover:cursor-pointer ${
                    activeCategory === cat.key
                      ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/20'
                      : 'bg-bg-card text-text-secondary hover:bg-bg-card-hover hover:text-white border border-border-default'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}



        {/* Grid */}
        <div className="px-4 sm:px-8 md:px-12 lg:px-16">
          {isLoading ? (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-bg-card border border-border-default">
                  <div className="skeleton aspect-3/4" />
                  <div className="p-2.5 sm:p-3 space-y-1.5">
                    <div className="skeleton h-3 sm:h-4 w-3/4 rounded" />
                    <div className="skeleton h-2.5 sm:h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentItems.length > 0 ? (
            <>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {currentItems.map((anime: AnimeMedia, i: number) => (
                  <BrowseCard key={`${anime.id}-${i}`} anime={anime} index={i % 30} />
                ))}
              </div>
              
              {/* Infinite Scroll Trigger */}
              <div ref={loadMoreRef} className="w-full py-8 mt-4 flex justify-center">
                {isFetchingNextPage && (
                  <Loader2 size={24} className="animate-spin text-accent-purple" />
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16 sm:py-20">
              <p className="text-text-muted text-sm">No anime found.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
