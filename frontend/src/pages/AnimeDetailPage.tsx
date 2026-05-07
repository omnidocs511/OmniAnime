/**
 * AnimeDetailPage — full anime detail view.
 * Fully responsive: stacked layout on mobile, side-by-side on desktop.
 */

import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Star,
  Users,
  Play,
} from 'lucide-react';
import { useAnimeDetail, useEpisodes } from '@/hooks/useAnime';
import {
  formatNumber,
  formatStatus,
  getStatusClass,
  formatDate,
  stripHtml,
  formatAiringDate,
  truncate,
} from '@/lib/utils';
import EpisodeList from '@/components/EpisodeList';
import { DetailSkeleton } from '@/components/Skeletons';
import type { AnimeMedia } from '@/lib/types';
import { useState, useEffect } from 'react';

const SYNOPSIS_LIMIT = 300;

function SynopsisBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > SYNOPSIS_LIMIT;

  return (
    <div className="mt-3 sm:mt-5 mb-6">
      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
        {isLong && !expanded ? text.slice(0, SYNOPSIS_LIMIT).trimEnd() + '…' : text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 text-xs text-accent-purple hover:text-accent-purple/80 font-medium transition-colors hover:cursor-pointer"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

export default function AnimeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const animeId = parseInt(id || '0', 10);

  const { data: detailData, isLoading: detailLoading } = useAnimeDetail(animeId);
  const { data: episodesData, isLoading: epsLoading } = useEpisodes(animeId);

  // Derive data only if available
  const anime: AnimeMedia | undefined = detailData?.data;
  const title = anime 
    ? (anime.title.english || anime.title.userPreferred || anime.title.romaji) 
    : 'Loading...';
  
  const banner = anime?.bannerImage || anime?.coverImage.extraLarge;
  const poster = anime?.coverImage.extraLarge || anime?.coverImage.large;
  const desc = anime?.description ? stripHtml(anime.description) : '';
  
  const subtitles: string[] = [];
  if (anime && anime.title.romaji && anime.title.romaji !== title) {
    subtitles.push(anime.title.romaji);
  }

  const nextEpInfo = anime?.nextAiringEpisode
    ? `Episode ${anime.nextAiringEpisode.episode} : ${formatAiringDate(anime.nextAiringEpisode.airingAt)}`
    : null;

  useEffect(() => {
    document.title = `${title} - OmniAnime`;
  }, [title]);

  return (
    <>
      <Helmet>
        <title>{title} - OmniAnime</title>
        <meta name="description" content={desc ? truncate(desc, 160) : (anime ? `Details for ${title}` : 'Loading anime details...')} />
      </Helmet>

      {detailLoading ? (
        <DetailSkeleton />
      ) : !anime ? (
        <div className="pt-20 text-center text-text-muted">Anime not found.</div>
      ) : (
        <main className="pt-14 pb-6 sm:pb-8">
          {/* Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative w-full h-[200px] xs:h-[240px] sm:h-[300px] md:h-[350px] lg:h-[380px] overflow-hidden"
          >
            <img src={banner} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-linear-to-t from-bg-primary via-bg-primary/60 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-r from-bg-primary/80 to-transparent" />
          </motion.div>

          {/* Content */}
          <div className="px-4 sm:px-8 md:px-12 lg:px-16 -mt-28 xs:-mt-32 sm:-mt-40 md:-mt-48 lg:-mt-52 relative z-10">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Poster */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="shrink-0 flex sm:block justify-center"
              >
                <img
                  src={poster}
                  alt={title}
                  className="w-[140px] xs:w-[160px] sm:w-[190px] md:w-[210px] lg:w-[230px] rounded-lg shadow-2xl shadow-black/50 border border-border-default"
                />
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-1 min-w-0 pt-1 sm:pt-4 md:pt-8"
              >
                {/* Title */}
                <h1 className="text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">{title}</h1>
                {subtitles.length > 0 && (
                  <p className="text-xs sm:text-sm text-text-secondary mt-0.5 sm:mt-1 line-clamp-2">
                    {subtitles.join(' • ')}
                  </p>
                )}

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-4 text-xs sm:text-sm text-text-secondary">
                  {anime.format && <span>{anime.format}</span>}
                  {anime.format && <span className="text-text-muted">•</span>}
                  {anime.episodes && <span>{anime.episodes} episodes</span>}
                  {anime.episodes && <span className="text-text-muted">•</span>}
                  {anime.status && (
                    <span className={`badge ${getStatusClass(anime.status)}`}>
                      {formatStatus(anime.status)}
                    </span>
                  )}
                  {anime.startDate?.year && (
                    <>
                      <span className="text-text-muted">•</span>
                      <span>{formatDate(anime.startDate)}</span>
                    </>
                  )}
                  {anime.season && (
                    <>
                      <span className="text-text-muted hidden xs:inline">•</span>
                      <span className="uppercase hidden xs:inline">{anime.season}</span>
                    </>
                  )}
                </div>

                {/* Score row */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm">
                  {anime.averageScore && (
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Star size={12} className="fill-yellow-400 text-yellow-400 sm:w-3.5 sm:h-3.5" />
                      {anime.averageScore} / 100
                    </span>
                  )}
                  {anime.popularity && (
                    <span className="flex items-center gap-1 text-text-secondary">
                      <Users size={12} className="sm:w-3.5 sm:h-3.5" />
                      {formatNumber(anime.popularity)}
                    </span>
                  )}
                </div>

                {/* Genres */}
                {anime.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-4">
                    {anime.genres.map((g) => (
                      <span
                        key={g}
                        className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded bg-white/5 text-text-secondary border border-border-default hover:border-accent-purple/30 hover:text-accent-purple transition-colors cursor-default"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Next episode info */}
                {nextEpInfo && (
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-accent-cyan">
                    {nextEpInfo}
                  </p>
                )}

                {/* Watch Now button */}
                <Link
                  to={`/watch/${animeId}/1`}
                  className="inline-flex items-center gap-2 mt-3 sm:mt-4 px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold text-xs sm:text-sm transition-all hover:shadow-lg hover:shadow-accent-purple/30 hover:cursor-pointer"
                >
                  <Play size={16} fill="white" />
                  Watch Now
                </Link>


                {/* Synopsis */}
                {desc && (
                  <SynopsisBlock text={desc} />
                )}


              </motion.div>
            </div>

            {/* Episode List */}
            <EpisodeList
              episodes={episodesData?.data || []}
              nextAiring={episodesData?.nextAiring || anime.nextAiringEpisode}
              animeTitle={title}
              animeId={animeId}
              totalEpisodes={anime.episodes}
              loading={epsLoading}
            />

            {/* Recommendations */}
            {anime.recommendations?.nodes?.length > 0 && (
              <section className="mt-8 sm:mt-10">
                <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Recommendations</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                  {anime.recommendations.nodes
                    .filter((n) => n.mediaRecommendation)
                    .map((n) => (
                      <a
                        key={n.mediaRecommendation.id}
                        href={`/anime/${n.mediaRecommendation.id}`}
                        className="group block"
                      >
                        <div className="aspect-2/3 rounded-lg overflow-hidden bg-bg-card">
                          <img
                            src={n.mediaRecommendation.coverImage.large}
                            alt={n.mediaRecommendation.title.userPreferred}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <p className="text-[10px] sm:text-xs font-medium text-text-primary mt-1 sm:mt-1.5 line-clamp-2">
                          {n.mediaRecommendation.title.userPreferred}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-text-muted mt-0.5">
                          {n.mediaRecommendation.format}{' '}
                          {n.mediaRecommendation.averageScore && `• ★ ${n.mediaRecommendation.averageScore}`}
                        </p>
                      </a>
                    ))}
                </div>
              </section>
            )}
          </div>
        </main>
      )}
    </>
  );
}
