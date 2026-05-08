/**
 * VideoPlayer — adaptive video player for anime streaming.
 * Supports HLS (.m3u8) via hls.js, direct MP4 via native <video>,
 * and shows quality/source selector when multiple sources exist.
 * Includes settings gear for audio (SUB/DUB) and subtitle track selection.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Maximize,
  Volume2,
  VolumeX,
  Settings,
  Loader2,
  AlertTriangle,
  Monitor,
  ChevronRight,
  ChevronLeft,
  Captions,
  Mic,
  Languages,
  Check,
  Rewind,
  FastForward,
} from 'lucide-react';
import type { StreamSource } from '@/lib/types';

interface Props {
  sources: StreamSource[];
  headers?: Record<string, string>;
  title?: string;
  onError?: () => void;
  subOrDub?: 'sub' | 'dub';
  onSubOrDubChange?: (value: 'sub' | 'dub') => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getPlayableUrl(source: StreamSource, headers?: Record<string, string>): string {
  const referer = headers?.Referer || headers?.referer || '';
  // If there's a referer header, we need to proxy through backend
  if (referer) {
    const params = new URLSearchParams({ url: source.url, referer });
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    return `${base}/stream/proxy?${params.toString()}`;
  }
  return source.url;
}

type SettingsView = 'main' | 'quality' | 'audio' | 'subtitle';

export default function VideoPlayer({ sources, headers, title, onError, subOrDub = 'sub', onSubOrDubChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const [activeSource, setActiveSource] = useState<StreamSource | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [subtitleTrack, setSubtitleTrack] = useState<number>(-1); // -1 = off
  const [hlsLevels, setHlsLevels] = useState<{ height: number; bitrate: number }[]>([]);
  const [currentHlsLevel, setCurrentHlsLevel] = useState<number>(-1); // -1 = auto

  // Close settings on outside click
  useEffect(() => {
    if (!showSettings) return;
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
        setSettingsView('main');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  // Pick the best source (prefer highest quality)
  useEffect(() => {
    if (!sources.length) return;
    const qualityOrder = ['1080p', '720p', '480p', '360p', 'default', 'backup'];
    const sorted = [...sources].sort((a, b) => {
      const ai = qualityOrder.indexOf(a.quality);
      const bi = qualityOrder.indexOf(b.quality);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    setActiveSource(sorted[0]);
    setHasError(false);
  }, [sources]);

  // Load video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSource) return;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsBuffering(true);
    setHasError(false);

    const playUrl = getPlayableUrl(activeSource, headers);

    if (activeSource.isM3U8) {
      // Dynamic import of hls.js
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({
            // Low Internet Optimization: drastically increase buffer sizes
            maxBufferLength: 120,          // Buffer up to 120 seconds ahead
            maxMaxBufferLength: 240,       // Max absolute memory buffer (240s)
            maxBufferSize: 60 * 1000 * 1000, // Allow up to 60MB of video chunks in memory
            startLevel: -1,                // Explicitly start in auto-adaptive mode
          });
          hlsRef.current = hls;
          hls.loadSource(playUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, (_: any, data: any) => {
            setHlsLevels(data.levels.map((l: any) => ({ height: l.height, bitrate: l.bitrate })));
            setCurrentHlsLevel(-1);
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              setHasError(true);
              onError?.();
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS
          video.src = playUrl;
          video.play().catch(() => {});
        } else {
          setHasError(true);
        }
      }).catch(() => {
        setHasError(true);
      });
    } else {
      video.src = playUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeSource, onError]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
    };
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange = () => setIsMuted(video.muted);
    const onVideoError = () => {
      setHasError(true);
      onError?.();
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('error', onVideoError);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('error', onVideoError);
    };
  }, [onError]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isPlaying, resetControlsTimer]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video || !duration || !isFinite(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * duration;
  };

  const skipBackward = (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const video = videoRef.current;
    if (!video || !duration || !isFinite(duration)) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const skipForward = (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const video = videoRef.current;
    if (!video || !duration || !isFinite(duration)) return;
    video.currentTime = Math.min(duration, video.currentTime + 10);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Get subtitle tracks from video element
  const getSubtitleTracks = (): TextTrack[] => {
    const video = videoRef.current;
    if (!video) return [];
    return Array.from(video.textTracks || []);
  };

  const handleSubtitleChange = (index: number) => {
    const video = videoRef.current;
    if (!video) return;

    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = i === index ? 'showing' : 'hidden';
    }
    setSubtitleTrack(index);
  };

  if (!sources.length && !hasError) {
    return (
      <div className="aspect-video bg-bg-card rounded-xl flex items-center justify-center border border-border-default">
        <div className="text-center space-y-3">
          <AlertTriangle size={32} className="text-yellow-500 mx-auto" />
          <p className="text-sm font-medium text-text-primary">No video sources available</p>
          <p className="text-xs text-text-muted">This episode may not be available from the streaming provider yet.</p>
        </div>
      </div>
    );
  }

  const subtitleTracks = getSubtitleTracks();

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseMove={resetControlsTimer}
      onClick={(e) => {
        // Don't toggle play when clicking controls
        if ((e.target as HTMLElement).closest('.player-controls')) return;
        togglePlay();
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        crossOrigin="anonymous"
      />

      {/* Loading spinner */}
      <AnimatePresence>
        {isBuffering && !hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
          >
            <Loader2 size={40} className="text-accent-purple animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center space-y-2">
            <AlertTriangle size={32} className="text-yellow-500 mx-auto" />
            <p className="text-sm text-text-primary">Failed to play video</p>
            <p className="text-xs text-text-muted">Try a different quality or source</p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="player-controls absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/40 pointer-events-none"
          >
            {/* Top bar: title */}
            {title && (
              <div className="absolute top-0 left-0 right-0 px-3 sm:px-4 pt-3 pointer-events-auto">
                <p className="text-xs sm:text-sm text-white/90 font-medium truncate">{title}</p>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 px-2 sm:px-4 pb-2 sm:pb-3 pointer-events-auto space-y-1.5">
              {/* Progress bar */}
              <div
                className="h-1 sm:h-1.5 bg-white/20 rounded-full cursor-pointer group/progress"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-accent-purple rounded-full relative transition-all"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-accent-purple rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-md" />
                </div>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Skip Backward */}
                  <button
                    onClick={skipBackward}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-white hover:cursor-pointer"
                    title="Rewind 10s"
                  >
                    <Rewind size={16} />
                  </button>

                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-white hover:cursor-pointer"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} fill="white" />}
                  </button>

                  {/* Skip Forward */}
                  <button
                    onClick={skipForward}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-white hover:cursor-pointer"
                    title="Skip 10s"
                  >
                    <FastForward size={16} />
                  </button>

                  {/* Volume */}
                  <button
                    onClick={toggleMute}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-white hover:cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  {/* Time */}
                  <span className="text-[10px] sm:text-xs text-white/70 ml-1 tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 sm:gap-1">
                  {/* Settings (Quality / Audio / Subtitles) */}
                  <div ref={settingsRef} className="relative">
                    <button
                      onClick={() => {
                        setShowSettings(!showSettings);
                        setSettingsView('main');
                      }}
                      className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-white hover:cursor-pointer"
                    >
                      <Settings size={16} className={`transition-transform duration-300 ${showSettings ? 'rotate-45' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 min-w-[180px] rounded-lg bg-bg-secondary/95 backdrop-blur-md border border-border-default shadow-2xl overflow-hidden"
                        >
                          {/* Main menu */}
                          {settingsView === 'main' && (
                            <div className="py-1">
                              <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                Settings
                              </div>

                              {/* Quality option - ALWAYS show so user knows current quality */}
                              <button
                                onClick={() => setSettingsView('quality')}
                                className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between hover:cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Monitor size={14} />
                                  Quality
                                </div>
                                <div className="flex items-center gap-1 text-text-muted">
                                  <span className="text-[10px]">
                                    {hlsLevels.length > 0 
                                      ? (currentHlsLevel === -1 ? 'Auto' : `${hlsLevels[currentHlsLevel]?.height}p`)
                                      : activeSource?.quality || 'Auto'}
                                  </span>
                                  <ChevronRight size={12} />
                                </div>
                              </button>

                              {/* Audio option */}
                              <button
                                onClick={() => setSettingsView('audio')}
                                className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between hover:cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Mic size={14} />
                                  Audio
                                </div>
                                <div className="flex items-center gap-1 text-text-muted">
                                  <span className="text-[10px]">
                                    {subOrDub === 'sub' ? 'Japanese' : 'English'}
                                  </span>
                                  <ChevronRight size={12} />
                                </div>
                              </button>

                              {/* Subtitle option */}
                              <button
                                onClick={() => setSettingsView('subtitle')}
                                className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between hover:cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Languages size={14} />
                                  Subtitle
                                </div>
                                <div className="flex items-center gap-1 text-text-muted">
                                  <span className="text-[10px]">
                                    {subtitleTrack === -1 ? (subOrDub === 'sub' ? 'English' : 'Off') : `Track ${subtitleTrack + 1}`}
                                  </span>
                                  <ChevronRight size={12} />
                                </div>
                              </button>
                            </div>
                          )}

                          {/* Quality sub-menu */}
                          {settingsView === 'quality' && (
                            <div className="py-1">
                              <button
                                onClick={() => setSettingsView('main')}
                                className="w-full px-3 py-1.5 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors hover:cursor-pointer"
                              >
                                <ChevronLeft size={12} />
                                Quality
                              </button>

                              {/* Native sources list (if any) */}
                              {sources.map((src, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    setActiveSource(src);
                                    setShowSettings(false);
                                    setSettingsView('main');
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 hover:cursor-pointer ${
                                    src === activeSource && hlsLevels.length === 0
                                      ? 'text-accent-purple bg-accent-purple/10'
                                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  {src === activeSource && hlsLevels.length === 0 && <Check size={12} className="text-accent-purple" />}
                                  {(src !== activeSource || hlsLevels.length > 0) && <div className="w-3" />}
                                  <Monitor size={14} />
                                  {src.quality}
                                  {src.isM3U8 && (
                                    <span className="text-[9px] text-text-muted ml-auto">HLS</span>
                                  )}
                                </button>
                              ))}

                              {/* HLS levels list (from inside the M3U8) */}
                              {hlsLevels.length > 0 && (
                                <>
                                  <div className="px-3 py-1 mt-1 text-[9px] font-semibold text-text-muted uppercase tracking-wider border-t border-border-default pt-2">
                                    Stream Quality
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (hlsRef.current) hlsRef.current.currentLevel = -1;
                                      setCurrentHlsLevel(-1);
                                      setShowSettings(false);
                                      setSettingsView('main');
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 hover:cursor-pointer ${
                                      currentHlsLevel === -1
                                        ? 'text-accent-purple bg-accent-purple/10'
                                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                                    }`}
                                  >
                                    {currentHlsLevel === -1 && <Check size={12} className="text-accent-purple" />}
                                    {currentHlsLevel !== -1 && <div className="w-3" />}
                                    <Monitor size={14} />
                                    Auto
                                  </button>
                                  {hlsLevels.map((level, i) => (
                                    <button
                                      key={`hls-${i}`}
                                      onClick={() => {
                                        if (hlsRef.current) hlsRef.current.currentLevel = i;
                                        setCurrentHlsLevel(i);
                                        setShowSettings(false);
                                        setSettingsView('main');
                                      }}
                                      className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 hover:cursor-pointer ${
                                        currentHlsLevel === i
                                          ? 'text-accent-purple bg-accent-purple/10'
                                          : 'text-text-secondary hover:text-white hover:bg-white/5'
                                      }`}
                                    >
                                      {currentHlsLevel === i && <Check size={12} className="text-accent-purple" />}
                                      {currentHlsLevel !== i && <div className="w-3" />}
                                      <Monitor size={14} />
                                      {level.height}p
                                      <span className="text-[9px] text-text-muted ml-auto">
                                        {Math.round(level.bitrate / 1024)} kbps
                                      </span>
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          )}

                          {/* Audio sub-menu */}
                          {settingsView === 'audio' && (
                            <div className="py-1">
                              <button
                                onClick={() => setSettingsView('main')}
                                className="w-full px-3 py-1.5 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors hover:cursor-pointer"
                              >
                                <ChevronLeft size={12} />
                                Audio
                              </button>

                              <button
                                onClick={() => {
                                  onSubOrDubChange?.('sub');
                                  setShowSettings(false);
                                  setSettingsView('main');
                                }}
                                className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 hover:cursor-pointer ${
                                  subOrDub === 'sub'
                                    ? 'text-accent-purple bg-accent-purple/10'
                                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {subOrDub === 'sub' && <Check size={12} className="text-accent-purple" />}
                                {subOrDub !== 'sub' && <div className="w-3" />}
                                <Captions size={14} />
                                Japanese (SUB)
                              </button>

                              <button
                                onClick={() => {
                                  onSubOrDubChange?.('dub');
                                  setShowSettings(false);
                                  setSettingsView('main');
                                }}
                                className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 hover:cursor-pointer ${
                                  subOrDub === 'dub'
                                    ? 'text-accent-cyan bg-accent-cyan/10'
                                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {subOrDub === 'dub' && <Check size={12} className="text-accent-cyan" />}
                                {subOrDub !== 'dub' && <div className="w-3" />}
                                <Mic size={14} />
                                English (DUB)
                              </button>
                            </div>
                          )}

                          {/* Subtitle sub-menu */}
                          {settingsView === 'subtitle' && (
                            <div className="py-1">
                              <button
                                onClick={() => setSettingsView('main')}
                                className="w-full px-3 py-1.5 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1 hover:text-white transition-colors hover:cursor-pointer"
                              >
                                <ChevronLeft size={12} />
                                Subtitle
                              </button>

                              {/* Default subtitle based on audio mode */}
                              <button
                                onClick={() => {
                                  handleSubtitleChange(-1);
                                  setShowSettings(false);
                                  setSettingsView('main');
                                }}
                                className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 hover:cursor-pointer ${
                                  subtitleTrack === -1
                                    ? 'text-accent-purple bg-accent-purple/10'
                                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {subtitleTrack === -1 && <Check size={12} className="text-accent-purple" />}
                                {subtitleTrack !== -1 && <div className="w-3" />}
                                {subOrDub === 'sub' ? 'English (default)' : 'Off'}
                              </button>

                              {/* Dynamic subtitle tracks from video element */}
                              {subtitleTracks.length > 0 ? (
                                subtitleTracks.map((track, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      handleSubtitleChange(i);
                                      setShowSettings(false);
                                      setSettingsView('main');
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 hover:cursor-pointer ${
                                      subtitleTrack === i
                                        ? 'text-accent-purple bg-accent-purple/10'
                                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                                    }`}
                                  >
                                    {subtitleTrack === i && <Check size={12} className="text-accent-purple" />}
                                    {subtitleTrack !== i && <div className="w-3" />}
                                    {track.label || track.language || `Track ${i + 1}`}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-[10px] text-text-muted italic">
                                  No additional tracks available
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors text-white hover:cursor-pointer"
                  >
                    <Maximize size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center play button when paused */}
      <AnimatePresence>
        {!isPlaying && !isBuffering && !hasError && showControls && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 rounded-full bg-accent-purple/90 hover:bg-accent-purple text-white transition-colors hover:cursor-pointer shadow-2xl shadow-accent-purple/30"
          >
            <Play size={28} fill="white" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
