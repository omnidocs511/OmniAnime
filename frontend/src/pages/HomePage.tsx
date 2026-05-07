/**
 * HomePage — Hero banner + Top Airing + Trending + Seasonal + Popular sections.
 * Matches the OmniAnime homepage layout from the screenshots.
 */

import { Helmet } from 'react-helmet-async';
import { useTrending, useTopAiring, useSeasonal, usePopular } from '@/hooks/useAnime';
import { getCurrentSeason } from '@/lib/utils';
import HeroBanner from '@/components/HeroBanner';
import AnimeGrid from '@/components/AnimeGrid';
import { HeroSkeleton } from '@/components/Skeletons';

export default function HomePage() {
  const { season, year } = getCurrentSeason();

  const trending = useTrending(1, 10);
  const topAiring = useTopAiring(1, 20);
  const seasonal = useSeasonal(season, year, 1, 20);
  const popular = usePopular(1, 20);

  const heroItems = trending.data?.media?.slice(0, 5) || [];

  return (
    <>
      <Helmet>
        <title>OmniAnime</title>
        <meta
          name="description"
          content="OmniAnime - The best place to watch anime online."
        />
      </Helmet>

      <main className="pt-14">
        {/* Hero Banner */}
        {trending.isLoading ? (
          <HeroSkeleton />
        ) : (
          heroItems.length > 0 && <HeroBanner items={heroItems} />
        )}

        <div className="mt-8 space-y-2">
          {/* Top Airing */}
          <AnimeGrid
            title="Top Airing Anime"
            items={topAiring.data?.media || []}
            loading={topAiring.isLoading}
          />

          {/* Trending */}
          <AnimeGrid
            title="Trending Now"
            items={trending.data?.media || []}
            loading={trending.isLoading}
          />

          {/* Seasonal */}
          <AnimeGrid
            title={`${season.charAt(0) + season.slice(1).toLowerCase()} ${year} Anime`}
            items={seasonal.data?.media || []}
            loading={seasonal.isLoading}
          />

          {/* All-time Popular */}
          <AnimeGrid
            title="Popular All Time"
            items={popular.data?.media || []}
            loading={popular.isLoading}
          />
        </div>
      </main>
    </>
  );
}
