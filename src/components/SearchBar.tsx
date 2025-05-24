import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search stations..." 
}) => {
  return (
    <div className="search-bar">
      <Search size={20} className="search-icon" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {value && (
        <button
          className="clear-btn"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}; 