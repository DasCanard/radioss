import { Plus, Radio, Star, StarOff, Trash2 } from 'lucide-react';
import { RadioStation } from '../types';

interface CustomStationsSectionProps {
  stations: RadioStation[];
  currentStation: RadioStation | null;
  isPlaying: boolean;
  favorites: string[];
  onStationSelect: (station: RadioStation) => void;
  onToggleFavorite: (stationId: string) => void;
  onDeleteStation: (stationId: string) => void;
  onAddStation: () => void;
}

export function CustomStationsSection({
  stations,
  currentStation,
  isPlaying,
  favorites,
  onStationSelect,
  onToggleFavorite,
  onDeleteStation,
  onAddStation
}: CustomStationsSectionProps) {
  if (stations.length === 0) {
    return (
      <div className="custom-stations-section">
        <div className="section-header">
          <h3 className="section-title">
            <Radio size={20} />
            Your Custom Stations
          </h3>
          <button className="btn-secondary" onClick={onAddStation}>
            <Plus size={16} />
            Add Station
          </button>
        </div>
        <div className="empty-custom-stations">
          <p>No custom stations yet. Add your favorite stations to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-stations-section">
      <div className="section-header">
        <h3 className="section-title">
          <Radio size={20} />
          Your Custom Stations ({stations.length})
        </h3>
        <button className="btn-secondary" onClick={onAddStation}>
          <Plus size={16} />
          Add Station
        </button>
      </div>
      <div className="custom-stations-grid">
        {stations.map((station) => {
          const isCurrent = currentStation?.id === station.id;
          const isFavorite = favorites.includes(station.id);
          
          return (
            <div
              key={station.id}
              className={`custom-station-card ${isCurrent ? 'active' : ''}`}
              onClick={() => onStationSelect(station)}
            >
              <div className="station-icon-small">
                {station.favicon ? (
                  <img src={station.favicon} alt={station.name} />
                ) : (
                  <Radio size={20} className="default-icon-small" />
                )}
              </div>
              <div className="station-info">
                <h4 className="text-clamp-2" title={station.name}>{station.name}</h4>
                <div className="station-meta">
                  {station.country && <span>{station.country}</span>}
                  {station.bitrate && <span>{station.bitrate} kbps</span>}
                </div>
              </div>
              <div className="station-actions">
                <button
                  className={`action-btn ${isFavorite ? 'favorite' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(station.id);
                  }}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                </button>
                <button
                  className="action-btn delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStation(station.id);
                  }}
                  title="Delete custom station"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {isCurrent && isPlaying && (
                <div className="playing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 