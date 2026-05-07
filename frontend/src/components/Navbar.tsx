/**
 * Navbar — OmniAnime header with logo, nav links, back/forward, and search.
 * Fully responsive: hamburger menu on mobile, inline links on desktop.
 */

import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import SearchModal from './SearchModal';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Browse' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="flex items-center justify-between h-14 px-3 sm:px-5">

          {/* ── Left zone: Logo + Nav links + Back/Forward ── */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0 mr-1 sm:mr-3">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                OmniAnime<span className="text-accent-purple">.</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Separator */}
            <div className="hidden md:block w-px h-5 bg-border-default mx-1.5" />

            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-md hover:cursor-pointer hover:bg-white/5 transition-colors text-text-secondary hover:text-white"
              aria-label="Go back"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Forward */}
            <button
              onClick={() => navigate(1)}
              className="p-1.5 rounded-md hover:cursor-pointer hover:bg-white/5 transition-colors text-text-secondary hover:text-white"
              aria-label="Go forward"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* ── Right zone: Search + hamburger ── */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Search bar — full on md+, icon-only on mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden hover:cursor-pointer md:flex items-center gap-2 w-64 lg:w-80 px-3 py-1.5 rounded-lg bg-white/5 border border-border-default hover:border-border-hover transition-colors group"
            >
              <Search size={14} className="text-text-muted group-hover:text-text-secondary shrink-0" />
              <span className="text-sm text-text-muted group-hover:text-text-secondary">Search</span>
            </button>

            {/* Search icon — mobile only */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-1.5 rounded-md hover:bg-white/5 transition-colors text-text-secondary hover:text-white"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md hover:bg-white/5 transition-colors text-text-secondary hover:text-white hover:cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

        </div>

        {/* ── Mobile dropdown menu ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-border-default"
            >
              <div className="px-3 py-2 space-y-0.5">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-white bg-accent-purple/10 border-l-2 border-accent-purple'
                          : 'text-text-secondary hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
