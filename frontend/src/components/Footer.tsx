/**
 * Footer component — responsive layout with nav links.
 */

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-10 sm:mt-16 py-5 sm:py-8 px-4 sm:px-8 md:px-12 lg:px-16 border-t border-border-default">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Top row: Logo + Nav */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-base sm:text-lg font-extrabold text-white hover:text-accent-purple transition-colors">
              OmniAnime<span className="text-accent-purple">.</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <Link to="/" className="text-text-muted hover:text-white transition-colors">Home</Link>
            <Link to="/browse" className="text-text-muted hover:text-white transition-colors">Browse</Link>
            <Link to="/about" className="text-text-muted hover:text-white transition-colors">About</Link>
          </div>
        </div>

        {/* Bottom row: Credits */}
        <div className="flex flex-col sm:flex-row items-center justify-center  gap-2 pt-3 sm:pt-4 border-t border-border-default/50">
          <span className="text-[10px] sm:text-xs text-text-muted">© {new Date().getFullYear()} OmniFlow. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
