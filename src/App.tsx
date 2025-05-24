import { useState, useMemo, useEffect } from 'react';
import { Library, Plus, Home } from 'lucide-react';
import './App.css';
import { RadioStation } from './types';
import { defaultStations } from './data/defaultStations';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLoadingScreen } from './hooks/useLoadingScreen';
import { Player } from './components/Player';
import { StationList } from './components/StationList';
import { SearchBar } from './components/SearchBar';
import { AddStationModal } from './components/AddStationModal';
import { Footer } from './components/Footer';
import { UpdateNotification } from './components/UpdateNotification';

type View = 'browse' | 'library';

function App() {
  useLoadingScreen();

  const [view, setView] = useState<View>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [customStations, setCustomStations] = useLocalStorage<RadioStation[]>('customStations', []);
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);
  const [volume, setVolume] = useLocalStorage<number>('volume', 50);
  
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const allStations = useMemo(() => {
    return [...defaultStations, ...customStations];
  }, [customStations]);

  const filteredStations = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allStations.filter(station => 
      station.name.toLowerCase().includes(query) ||
      station.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      station.country?.toLowerCase().includes(query)
    );
  }, [allStations, searchQuery]);

  const libraryStations = useMemo(() => {
    return allStations.filter(station => favorites.includes(station.id));
  }, [allStations, favorites]);

  const displayedStations = view === 'library' ? libraryStations : filteredStations;

  const handleStationSelect = (station: RadioStation) => {
    if (currentStation?.id === station.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStation(station);
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleToggleFavorite = (stationId: string) => {
    setFavorites((prev: string[]) => 
      prev.includes(stationId) 
        ? prev.filter((id: string) => id !== stationId)
        : [...prev, stationId]
    );
  };

  const handleAddCustomStation = (station: RadioStation) => {
    setCustomStations((prev: RadioStation[]) => [...prev, station]);
  };

  const handleDeleteCustomStation = (stationId: string) => {
    setCustomStations((prev: RadioStation[]) => prev.filter((s: RadioStation) => s.id !== stationId));
    setFavorites((prev: string[]) => prev.filter((id: string) => id !== stationId));
    if (currentStation?.id === stationId) {
      setCurrentStation(null);
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (!currentStation) return;
    const currentIndex = displayedStations.findIndex(s => s.id === currentStation.id);
    if (currentIndex > 0) {
      setCurrentStation(displayedStations[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (!currentStation) return;
    const currentIndex = displayedStations.findIndex(s => s.id === currentStation.id);
    if (currentIndex < displayedStations.length - 1) {
      setCurrentStation(displayedStations[currentIndex + 1]);
    }
  };

  useEffect(() => {
    if (currentStation && !allStations.find(s => s.id === currentStation.id)) {
      setCurrentStation(null);
      setIsPlaying(false);
    }
  }, [allStations, currentStation]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-wrapper">
            <img src="/favicon.svg" alt="Radioss Logo" className="logo-icon" />
          </div>
          <h1>Radioss</h1>
        </div>
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${view === 'browse' ? 'active' : ''}`}
            onClick={() => setView('browse')}
          >
            <Home size={20} />
            Browse
          </button>
          <button 
            className={`nav-tab ${view === 'library' ? 'active' : ''}`}
            onClick={() => setView('library')}
          >
            <Library size={20} />
            Library ({libraryStations.length})
          </button>
        </nav>
      </header>

      <main className="app-main">
        <div className="content-header">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={view === 'library' ? 'Search your library...' : 'Search stations...'}
          />
          <button 
            className="btn-primary add-station-btn"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={20} />
            Add Station
          </button>
        </div>

        <div className="content-body">
          <StationList
            stations={displayedStations}
            currentStation={currentStation}
            isPlaying={isPlaying}
            favorites={favorites}
            onStationSelect={handleStationSelect}
            onToggleFavorite={handleToggleFavorite}
            onDeleteCustomStation={handleDeleteCustomStation}
          />
        </div>
      </main>

      <Player
        currentStation={currentStation}
        isPlaying={isPlaying}
        volume={volume}
        onPlayPause={handlePlayPause}
        onVolumeChange={setVolume}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />

      <Footer />

      <AddStationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCustomStation}
      />

      <UpdateNotification />
    </div>
  );
}

export default App;
