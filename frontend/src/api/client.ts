/**
 * API client for the OmniAnime backend.
 */

import axios from 'axios';
import type {
  AnimeDetailResponse,
  EpisodesResponse,
  PagedResponse,
  StreamEpisodesResponse,
  StreamSourcesResponse,
} from '@/lib/types';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE,
  timeout: 45000, // Increased to 45s for scraper cold starts
});

// ── Anime Endpoints ──────────────────────────────────────────────────────

export async function fetchAnimeById(id: number): Promise<AnimeDetailResponse> {
  const { data } = await api.get(`/anime/${id}`);
  return data;
}

export async function fetchEpisodes(id: number, page = 1): Promise<EpisodesResponse> {
  const { data } = await api.get(`/episodes/${id}`, { params: { page } });
  return data;
}

// ── Lists ────────────────────────────────────────────────────────────────

export async function fetchTrending(page = 1, perPage = 20): Promise<PagedResponse> {
  const { data } = await api.get('/trending', { params: { page, per_page: perPage } });
  return data;
}

export async function fetchTopAiring(page = 1, perPage = 20): Promise<PagedResponse> {
  const { data } = await api.get('/top-airing', { params: { page, per_page: perPage } });
  return data;
}

export async function fetchSeasonal(
  season?: string,
  year?: number,
  page = 1,
  perPage = 20,
): Promise<PagedResponse> {
  const { data } = await api.get('/season', { params: { season, year, page, per_page: perPage } });
  return data;
}

export async function fetchPopular(page = 1, perPage = 20): Promise<PagedResponse> {
  const { data } = await api.get('/popular', { params: { page, per_page: perPage } });
  return data;
}

// ── Search ───────────────────────────────────────────────────────────────

export async function searchAnime(q: string, page = 1, perPage = 20, genre?: string): Promise<PagedResponse> {
  const params: Record<string, any> = { q, page, per_page: perPage };
  if (genre) params.genre = genre;
  const { data } = await api.get('/search', { params });
  return data;
}

export async function fetchByGenre(genre: string, page = 1, perPage = 20): Promise<PagedResponse> {
  const { data } = await api.get('/genre', { params: { genre, page, per_page: perPage } });
  return data;
}

// ── Streaming ────────────────────────────────────────────────────────────

export async function fetchStreamEpisodes(title: string, type: string = 'sub', targetEpisodes?: number): Promise<StreamEpisodesResponse> {
  const params: Record<string, any> = { title, type };
  if (targetEpisodes) params.target_episodes = targetEpisodes;
  const { data } = await api.get('/stream/episodes', { params });
  return data;
}

export async function fetchStreamSources(
  title: string,
  ep: number,
  type: string = 'sub',
  server?: string,
  targetEpisodes?: number,
): Promise<StreamSourcesResponse> {
  const params: Record<string, any> = { title, ep, type };
  if (server) params.server = server;
  if (targetEpisodes) params.target_episodes = targetEpisodes;
  const { data } = await api.get('/stream/watch', { params });
  return data;
}

export default api;
