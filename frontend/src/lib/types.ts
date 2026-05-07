/* ── Types for the OmniAnime anime tracker ──────────────────────────────── */

export interface AnimeTitle {
  romaji: string;
  english: string | null;
  native: string | null;
  userPreferred: string;
}

export interface CoverImage {
  extraLarge: string;
  large: string;
  medium: string;
  color: string | null;
}

export interface DateObj {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface NextAiringEpisode {
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
}

export interface Studio {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
  rank: number;
  isMediaSpoiler: boolean;
}

export interface Trailer {
  id: string;
  site: string;
  thumbnail: string;
}

export interface RelationNode {
  id: number;
  title: { userPreferred: string };
  coverImage: { large: string };
  format: string;
  type: string;
}

export interface RelationEdge {
  relationType: string;
  node: RelationNode;
}

export interface RecommendationNode {
  mediaRecommendation: {
    id: number;
    title: { english?: string | null; romaji?: string | null; userPreferred: string };
    coverImage: { large: string };
    format: string;
    averageScore: number;
  };
}

export interface AnimeMedia {
  id: number;
  idMal: number | null;
  title: AnimeTitle;
  description: string | null;
  coverImage: CoverImage;
  bannerImage: string | null;
  format: string;
  status: string;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  startDate: DateObj;
  endDate: DateObj;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number;
  favourites: number;
  genres: string[];
  tags: Tag[];
  studios: { nodes: Studio[] };
  nextAiringEpisode: NextAiringEpisode | null;
  trailer: Trailer | null;
  relations: { edges: RelationEdge[] };
  recommendations: { nodes: RecommendationNode[] };
}

export interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface PagedResponse {
  source: string;
  media: AnimeMedia[];
  pageInfo: PageInfo;
}

export interface AnimeDetailResponse {
  source: string;
  data: AnimeMedia;
}

export interface Episode {
  mal_id: number;
  url: string;
  title: string;
  title_japanese: string | null;
  title_romanji: string | null;
  aired: string | null;
  score: number | null;
  filler: boolean;
  recap: boolean;
  forum_url: string | null;
}

export interface EpisodesResponse {
  source: string;
  data: Episode[];
  pagination: {
    last_visible_page?: number;
    has_next_page?: boolean;
  };
  nextAiring: NextAiringEpisode | null;
}

/* ── Streaming types ────────────────────────────────────────────────────── */

export interface StreamSource {
  url: string;
  quality: string;
  isM3U8: boolean;
  headers?: Record<string, string>;
}

export interface StreamSubtitle {
  url: string;
  lang: string;
}

export interface StreamEpisode {
  id: string;
  number: number;
  title?: string | null;
}

export interface StreamEpisodesResponse {
  providerId: string | null;
  providerName: string;
  providerTitle: string;
  subOrDub: string;
  totalEpisodes: number;
  episodes: StreamEpisode[];
}

export interface StreamSourcesResponse {
  sources: StreamSource[];
  subtitles: StreamSubtitle[];
  headers?: Record<string, string>;
  download?: string;
  provider: string;
  providerId: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle?: string | null;
  totalEpisodes: number;
  episodes: StreamEpisode[];
  error?: string;
}
