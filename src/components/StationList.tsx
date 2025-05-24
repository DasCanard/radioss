import React from 'react';
import { RadioStation } from '../types';
import { Star, StarOff, Trash2 } from 'lucide-react';

interface StationListProps {
  stations: RadioStation[];
  currentStation: RadioStation | null;
  isPlaying: boolean;
  favorites: string[];
  onStationSelect: (station: RadioStation) => void;
  onToggleFavorite: (stationId: string) => void;
  onDeleteCustomStation: (stationId: string) => void;
}

export const StationList: React.FC<StationListProps> = ({
  stations,
  currentStation,
  isPlaying,
  favorites,
  onStationSelect,
  onToggleFavorite,
  onDeleteCustomStation
}) => {
  return (
    <div className="station-list">
      {stations.map((station) => {
        const isActive = currentStation?.id === station.id;
        const isFavorite = favorites.includes(station.id);
        
        return (
          <div 
            key={station.id} 
            className={`station-item ${isActive ? 'active' : ''}`}
          >
            <div 
              className="station-main"
              onClick={() => onStationSelect(station)}
            >
              <div className="station-icon-small">
                {station.favicon ? (
                  <img 
                    src={station.favicon} 
                    alt={station.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="default-icon-small">📻</div>
                )}
              </div>
              
              <div className="station-info">
                <h4>{station.name}</h4>
                <div className="station-meta">
                  {station.country && <span className="country">{station.country}</span>}
                  {station.tags && station.tags.length > 0 && (
                    <span className="tags">{station.tags.slice(0, 2).join(', ')}</span>
                  )}
                </div>
              </div>
              
              {isActive && isPlaying && (
                <div className="playing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
            
            <div className="station-actions">
              <button
                className="action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(station.id);
                }}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
              </button>
              
              {station.isCustom && (
                <button
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCustomStation(station.id);
                  }}
                  title="Delete custom station"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      {stations.length === 0 && (
        <div className="empty-state">
          <p>No stations found</p>
        </div>
      )}
    </div>
  );
}; 