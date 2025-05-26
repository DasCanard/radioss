import React from 'react';
import { Heart } from 'lucide-react';
import packageInfo from '../../package.json';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p className="made-with">
          Made with <Heart size={14} className="heart-icon" /> by{' '}
          <a 
            href="https://richy.sh" 
            target="_blank" 
            rel="noopener noreferrer"
            className="author-link"
          >
            richy
          </a>
        </p>
        <span className="version-info">
          v{packageInfo.version}
        </span>
      </div>
    </footer>
  );
}; 