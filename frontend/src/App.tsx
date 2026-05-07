/**
 * OmniAnime — Main App with routing, React Query provider, and layout.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import AnimeDetailPage from '@/pages/AnimeDetailPage';
import BrowsePage from '@/pages/BrowsePage';
import AboutPage from '@/pages/AboutPage';
import WatchPage from '@/pages/WatchPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-bg-primary text-text-primary">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/anime/:id" element={<AnimeDetailPage />} />
              <Route path="/watch/:id/:episode" element={<WatchPage />} />
            </Routes>
            <Footer />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>

  );
}
