import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Radio } from 'lucide-react';
import { RadioStation } from '../types';

interface PlayerProps {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  volume: number;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const Player: React.FC<PlayerProps> = ({
  currentStation,
  isPlaying,
  volume,
  onPlayPause,
  onVolumeChange,
  onPrevious,
  onNext
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && currentStation) {
      setIsLoading(true);
      setError(null);
      audioRef.current.src = currentStation.url;
      
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setError('Failed to play station');
          setIsLoading(false);
        });
      }
    }
  }, [currentStation, isPlaying]);

  const handleCanPlay = () => {
    setIsLoading(false);
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play station');
      });
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load station');
  };

  return (
    <div className="player">
      <audio
        ref={audioRef}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onLoadStart={() => setIsLoading(true)}
      />
      
      <div className="player-info">
        {currentStation ? (
          <>
            <div className="station-icon">
              {currentStation.favicon ? (
                <img 
                  src={currentStation.favicon} 
                  alt={currentStation.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="default-icon">
                  <Radio size={24} />
                </div>
              )}
            </div>
            <div className="station-details">
              <h3 className="text-clamp-2" title={currentStation.name}>{currentStation.name}</h3>
              {currentStation.tags && (
                <p>{currentStation.tags.slice(0, 3).join(' • ')}</p>
              )}
            </div>
          </>
        ) : (
          <div className="no-station">
            <p>Select a station to start listening</p>
          </div>
        )}
      </div>

      <div className="player-controls">
        <button 
          className="control-btn" 
          onClick={onPrevious}
          disabled={!currentStation}
        >
          <SkipBack size={20} />
        </button>
        
        <button 
          className="control-btn play-btn" 
          onClick={onPlayPause}
          disabled={!currentStation || isLoading}
        >
          {isLoading ? (
            <div className="spinner" />
          ) : isPlaying ? (
            <Pause size={24} />
          ) : (
            <Play size={24} />
          )}
        </button>
        
        <button 
          className="control-btn" 
          onClick={onNext}
          disabled={!currentStation}
        >
          <SkipForward size={20} />
        </button>
      </div>

      <div className="volume-control">
        <button 
          className="control-btn"
          onClick={() => onVolumeChange(volume === 0 ? 50 : 0)}
        >
          {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="volume-slider"
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}; 