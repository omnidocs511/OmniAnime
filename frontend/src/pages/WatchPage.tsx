/**
 * WatchPage — full anime streaming page.
 * Route: /watch/:id/:episode
 *
 * Layout:
 *   Desktop  → video player (left) + episode list (right sidebar)
 *   Mobile   → video player (top) + episode list (below)
 *
 * Below the player: anime info, server tabs (sub/dub), and recommendations.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Tv,
  Play,
  Loader2,
  ArrowLeft,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useAnimeDetail, useEpisodes, useStreamSources } from '@/hooks/useAnime';
import { stripHtml, truncate, formatNumber } from '@/lib/utils';
import VideoPlayer from '@/components/VideoPlayer';
import WatchEpisodeList from '@/components/WatchEpisodeList';
import type { AnimeMedia } from '@/lib/types';

export default function WatchPage() {
  const { id, episode } = useParams<{ id: string; episode: string }>();
  const navigate = useNavigate();
  const animeId = parseInt(id || '0', 10);
  const currentEp = parseInt(episode || '1', 10);

  const [subOrDub, setSubOrDub] = useState<'sub' | 'dub'>('sub');
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  // Fetch anime metadata from AniList
  const { data: detailData, isLoading: detailLoading } = useAnimeDetail(animeId);
  const anime: AnimeMedia | undefined = detailData?.data;

  // Fetch Jikan episode list as a fallback source for episode count
  const { data: jikanEpData } = useEpisodes(animeId);

  const title = anime
    ? (anime.title.english || anime.title.userPreferred || anime.title.romaji)
    : '';

  const searchTitle = anime
    ? (anime.title.romaji || anime.title.english || anime.title.userPreferred || '')
    : '';

  // Episode count always comes from AniList/Jikan — independent of SUB/DUB.
  // SUB/DUB only affects which audio track the video player loads.
  const totalEpisodes =
    (anime?.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : 0)
    || anime?.episodes
    || 0;


  // Fetch streaming sources
  const {
    data: streamData,
    isLoading: streamLoading,
    isError: streamError,
    refetch: refetchStream,
  } = useStreamSources(searchTitle, currentEp, subOrDub, undefined, totalEpisodes > 0 ? totalEpisodes : undefined);

  const sources = streamData?.sources || [];

  // Build episode list from AniList/Jikan data (same for SUB and DUB)
  const episodeList = useMemo(() => {
    const count = totalEpisodes || 0;
    if (count === 0) return [];

    // Build a title lookup from Jikan data (page 1 only, ~100 eps)
    const jikanTitles: Record<number, string> = {};
    if (jikanEpData?.data?.length) {
      jikanEpData.data.forEach((ep: any, i: number) => {
        jikanTitles[i + 1] = ep.title || '';
      });
    }

    return Array.from({ length: count }, (_, i) => ({
      id: `ep-${i + 1}`,
      number: i + 1,
      title: jikanTitles[i + 1] || null,
    }));
  }, [jikanEpData, totalEpisodes]);

  const desc = anime?.description ? stripHtml(anime.description) : '';
  const poster = anime?.coverImage.extraLarge || anime?.coverImage.large;

  // Navigate to episode
  const goToEpisode = (ep: number) => {
    navigate(`/watch/${animeId}/${ep}`, { replace: true });
  };

  const hasPrev = currentEp > 1;
  const hasNext = currentEp < totalEpisodes;

  // Keyboard shortcuts for episode navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'n' && hasNext) goToEpisode(currentEp + 1);
      if (e.key === 'p' && hasPrev) goToEpisode(currentEp - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentEp, hasNext, hasPrev]);

  // SEO
  const pageTitle = title
    ? `${title} - Episode ${currentEp} | OmniAnime`
    : 'Watch - OmniAnime';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={desc ? truncate(desc, 155) : `Watch ${title} Episode ${currentEp} on OmniAnime`}
        />
      </Helmet>

      <main className="pt-14 pb-8 min-h-screen">
        {/* Top bar: back button + episode title */}
        <div className="px-3 sm:px-6 md:px-8 lg:px-12 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(`/anime/${animeId}`)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary hover:text-white hover:cursor-pointer"
            aria-label="Back to details"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-white truncate">
              {detailLoading ? 'Loading...' : title}
            </p>
            <p className="text-[10px] sm:text-xs text-text-muted">
              Episode {currentEp}
              {streamData?.episodeTitle && ` — ${streamData.episodeTitle}`}
            </p>
          </div>
        </div>

        {/* Main content: player + episode sidebar */}
        <div className="px-3 sm:px-6 md:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left: Video player */}
            <div className="flex-1 min-w-0">
              {streamLoading ? (
                <div className="aspect-video bg-bg-card rounded-xl flex items-center justify-center border border-border-default">
                  <div className="text-center">
                    <Loader2 size={36} className="text-accent-purple animate-spin mx-auto mb-3" />
                    <p className="text-sm text-text-secondary">Loading video sources...</p>
                    <p className="text-xs text-text-muted mt-1">Searching for {subOrDub === 'sub' ? 'subbed' : 'dubbed'} version</p>
                  </div>
                </div>
              ) : streamError ? (
                <div className="aspect-video bg-bg-card rounded-xl flex items-center justify-center border border-border-default">
                  <div className="text-center px-6">
                    <p className="text-sm text-text-secondary mb-3">Failed to load streaming sources</p>
                    <button
                      onClick={() => refetchStream()}
                      className="px-4 py-2 rounded-lg bg-accent-purple hover:bg-accent-purple/80 text-white text-sm font-medium transition-colors hover:cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
              <VideoPlayer
                  sources={sources}
                  headers={streamData?.headers}
                  title={`${title} — Episode ${currentEp}`}
                  subOrDub={subOrDub}
                  onSubOrDubChange={setSubOrDub}
                />
              )}

              {/* Episode navigation + download */}
              <div className="flex items-center justify-between mt-3 gap-2">
                <button
                  onClick={() => hasPrev && goToEpisode(currentEp - 1)}
                  disabled={!hasPrev}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:cursor-pointer ${hasPrev
                      ? 'bg-bg-card hover:bg-bg-card-hover text-text-secondary hover:text-white border border-border-default'
                      : 'bg-bg-card/50 text-text-muted/50 border border-border-default/50 cursor-not-allowed'
                    }`}
                >
                  <ChevronLeft size={14} />
                  <span className="hidden xs:inline">Prev</span>
                </button>

                <div className="flex items-center gap-2">
                  {streamData?.download && (
                    <a
                      href={streamData.download}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-bg-card hover:bg-bg-card-hover text-text-secondary hover:text-accent-green text-xs sm:text-sm border border-border-default transition-colors"
                    >
                      <Download size={14} />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  )}

                  <span className="text-xs text-text-muted px-2">
                    EP {currentEp} / {totalEpisodes || '?'}
                  </span>
                </div>

                <button
                  onClick={() => hasNext && goToEpisode(currentEp + 1)}
                  disabled={!hasNext}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:cursor-pointer ${hasNext
                      ? 'bg-accent-purple hover:bg-accent-purple/80 text-white shadow-sm shadow-accent-purple/20'
                      : 'bg-bg-card/50 text-text-muted/50 border border-border-default/50 cursor-not-allowed'
                    }`}
                >
                  <span className="hidden xs:inline">Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Error message from stream API */}
              {streamData?.error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <p className="text-xs text-red-400">{streamData.error}</p>
                  <p className="text-[10px] text-text-muted mt-1">
                    Try switching between SUB/DUB, or check if a Consumet API instance is configured.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Right: Episode list sidebar */}
            <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0">
              <WatchEpisodeList
                episodes={episodeList}
                currentEpisode={currentEp}
                totalEpisodes={totalEpisodes}
                onSelect={goToEpisode}
              />
            </div>
          </div>
        </div>

        {/* Anime info section */}
        {anime && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-3 sm:px-6 md:px-8 lg:px-12 mt-6"
          >
            <div className="flex gap-4 p-4 rounded-xl bg-bg-card border border-border-default">
              {/* Poster */}
              <Link to={`/anime/${animeId}`} className="shrink-0">
                <img
                  src={poster}
                  alt={title}
                  className="w-[80px] sm:w-[100px] rounded-lg shadow-lg border border-border-default hover:border-accent-purple/30 transition-colors"
                />
              </Link>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <Link
                  to={`/anime/${animeId}`}
                  className="text-sm sm:text-base font-bold text-white hover:text-accent-purple transition-colors line-clamp-1"
                >
                  {title}
                </Link>

                {/* Metadata chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] sm:text-xs text-text-muted">
                  {anime.format && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5">
                      <Tv size={10} />
                      {anime.format}
                    </span>
                  )}
                  {anime.episodes && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5">
                      <Play size={10} />
                      {anime.episodes} ep
                    </span>
                  )}
                  {anime.averageScore && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5">
                      <Star size={10} className="fill-yellow-400 text-yellow-400" />
                      {(anime.averageScore / 10).toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Genres */}
                {anime.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {anime.genres.slice(0, 5).map((g) => (
                      <span
                        key={g}
                        className="px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded bg-white/5 text-text-muted border border-border-default"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Synopsis */}
                {desc && (
                  <div className="mt-2">
                    <p className="text-[10px] sm:text-xs text-text-secondary leading-relaxed">
                      {showFullSynopsis ? desc : truncate(desc, 200)}
                    </p>
                    {desc.length > 200 && (
                      <button
                        onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                        className="text-[10px] text-accent-purple hover:text-accent-purple/80 mt-1 hover:cursor-pointer"
                      >
                        {showFullSynopsis ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        {(anime?.recommendations?.nodes?.length ?? 0) > 0 && (
          <div className="px-3 sm:px-6 md:px-8 lg:px-12 mt-6">
            <h3 className="text-sm font-bold text-white mb-3">You might also like</h3>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {anime?.recommendations?.nodes
                .filter((n) => n.mediaRecommendation)
                .slice(0, 8)
                .map((n) => (
                  <Link
                    key={n.mediaRecommendation.id}
                    to={`/anime/${n.mediaRecommendation.id}`}
                    className="group shrink-0 w-[100px] sm:w-[120px]"
                  >
                    <div className="aspect-2/3 rounded-lg overflow-hidden bg-bg-card border border-border-default group-hover:border-accent-purple/30 transition-colors">
                      <img
                        src={n.mediaRecommendation.coverImage.large}
                        alt={n.mediaRecommendation.title.english || n.mediaRecommendation.title.userPreferred}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium text-text-primary mt-1.5 line-clamp-2 group-hover:text-accent-purple transition-colors">
                      {n.mediaRecommendation.title.english || n.mediaRecommendation.title.userPreferred}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="px-3 sm:px-6 md:px-8 lg:px-12 mt-8">
          <div className="flex items-center justify-center gap-4 text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-border-default font-mono">P</kbd>
              Prev Episode
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-border-default font-mono">N</kbd>
              Next Episode
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-border-default font-mono">F</kbd>
              Fullscreen
            </span>
          </div>
        </div>
      </main>
    </>
  );
}
