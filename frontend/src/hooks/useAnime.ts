/**
 * React Query hooks for data fetching.
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchAnimeById,
  fetchEpisodes,
  fetchTrending,
  fetchTopAiring,
  fetchSeasonal,
  fetchPopular,
  searchAnime,
  fetchByGenre,
  fetchStreamEpisodes,
  fetchStreamSources,
} from '@/api/client';

export function useAnimeDetail(id: number) {
  return useQuery({
    queryKey: ['anime', id],
    queryFn: () => fetchAnimeById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useEpisodes(id: number, page = 1) {
  return useQuery({
    queryKey: ['episodes', id, page],
    queryFn: () => fetchEpisodes(id, page),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useTrending(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['trending', page, perPage],
    queryFn: () => fetchTrending(page, perPage),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopAiring(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['top-airing', page, perPage],
    queryFn: () => fetchTopAiring(page, perPage),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSeasonal(season?: string, year?: number, page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['seasonal', season, year, page, perPage],
    queryFn: () => fetchSeasonal(season, year, page, perPage),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePopular(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['popular', page, perPage],
    queryFn: () => fetchPopular(page, perPage),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearch(query: string, page = 1, perPage = 20, genre?: string) {
  return useQuery({
    queryKey: ['search', query, genre, page, perPage],
    queryFn: () => searchAnime(query, page, perPage, genre),
    staleTime: 2 * 60 * 1000,
    enabled: query.length > 0,
  });
}

export function useByGenre(genre: string, page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['genre', genre, page, perPage],
    queryFn: () => fetchByGenre(genre, page, perPage),
    staleTime: 5 * 60 * 1000,
    enabled: genre.length > 0,
  });
}

export function useInfiniteAnime(
  category: 'trending' | 'top-airing' | 'seasonal' | 'popular' | 'search' | 'genre',
  params: any
) {
  return useInfiniteQuery({
    queryKey: ['infinite-anime', category, params],
    queryFn: ({ pageParam = 1 }) => {
      switch (category) {
        case 'trending': return fetchTrending(pageParam, params.perPage);
        case 'top-airing': return fetchTopAiring(pageParam, params.perPage);
        case 'seasonal': return fetchSeasonal(params.season, params.year, pageParam, params.perPage);
        case 'popular': return fetchPopular(pageParam, params.perPage);
        case 'search': return searchAnime(params.query, pageParam, params.perPage, params.genre);
        case 'genre': return fetchByGenre(params.genre, pageParam, params.perPage);
        default: throw new Error('Invalid category');
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.pageInfo?.hasNextPage) {
        return lastPage.pageInfo.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    enabled: params.enabled !== false,
  });
}

// ── Streaming hooks ──────────────────────────────────────────────────────

export function useStreamSources(title: string, episode: number, type: string = 'sub', server?: string, targetEpisodes?: number) {
  return useQuery({
    queryKey: ['stream-sources', title, episode, type, server, targetEpisodes],
    queryFn: () => fetchStreamSources(title, episode, type, server, targetEpisodes),
    staleTime: 3 * 60 * 1000,
    enabled: title.length > 0 && episode > 0,
    retry: 1,
  });
}

export function useStreamEpisodes(title: string, type: string = 'sub', targetEpisodes?: number) {
  return useQuery({
    queryKey: ['stream-episodes', title, type, targetEpisodes],
    queryFn: () => fetchStreamEpisodes(title, type, targetEpisodes),
    staleTime: 10 * 60 * 1000,
    enabled: title.length > 0,
    retry: 1,
  });
}
