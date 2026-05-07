/**
 * AboutPage — About OmniAnime platform, tech stack, and credits.
 */

import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About - OmniAnime</title>
        <meta name="description" content="Learn about OmniAnime, a modern anime discovery and tracking platform built with React, FastAPI, and AniList." />
      </Helmet>

      <main className="pt-14">
        {/* Hero */}
        <div className="relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative px-4 sm:px-8 md:px-12 lg:px-16 pt-10 sm:pt-16 pb-10 sm:pb-14 text-center">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
                About <span className="gradient-text">OmniAnime</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                A modern, open-source anime discovery and tracking platform built for anime enthusiasts.
                Explore trending, seasonal, and all-time popular anime with a premium, dark-themed experience.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Mission statement */}
        <motion.section
          {...fadeUp}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="px-4 sm:px-8 md:px-12 lg:px-16 mb-12 mt-10"
        >
          <div className="max-w-3xl mx-auto glass rounded-2xl p-6 sm:p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent-purple/15">
                <Heart size={20} className="text-accent-purple" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Our Mission</h2>
            </div>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              OmniAnime was created to provide anime fans with a beautiful, fast, and comprehensive platform
              to discover new anime and keep track of their favorites. We believe tracking your anime journey
              should be as enjoyable as watching it — that's why we've crafted every pixel with care, using
              modern technologies to deliver a seamless experience across all devices.
            </p>
          </div>
        </motion.section>

        {/* Made with love */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center pb-4"
        >
          <p className="text-xs sm:text-sm text-text-muted flex items-center justify-center gap-1.5">
            Made with <Heart size={12} className="fill-accent-pink text-accent-pink" /> for the anime community
          </p>
        </motion.div>
      </main>
    </>
  );
}
