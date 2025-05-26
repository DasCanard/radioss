import { useState, useMemo, useEffect } from 'react';
import { Library, Plus, Home, ArrowLeft, Globe, Radio, Star, StarOff } from 'lucide-react';
import './App.css';
import { RadioStation } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLoadingScreen } from './hooks/useLoadingScreen';
import { Player } from './components/Player';
import { StationList } from './components/StationList';
import { SearchBar } from './components/SearchBar';
import { AddStationModal } from './components/AddStationModal';
import { Footer } from './components/Footer';
import { UpdateNotification } from './components/UpdateNotification';
import { CountryList } from './components/CountryList';
import { CustomStationsSection } from './components/CustomStationsSection';
import { Breadcrumb } from './components/Breadcrumb';
import { RadioBrowserAPI, Country } from './services/radioBrowserApi';
import { convertRadioBrowserStations } from './services/stationConverter';

type View = 'browse' | 'library';
type BrowseView = 'countries' | 'stations';

function App() {
  useLoadingScreen();

  const [view, setView] = useState<View>('browse');
  const [browseView, setBrowseView] = useState<BrowseView>('countries');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [apiStations, setApiStations] = useState<RadioStation[]>([]);
  const [globalSearchResults, setGlobalSearchResults] = useState<RadioStation[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [customStations, setCustomStations] = useLocalStorage<RadioStation[]>('customStations', []);
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);
  const [favoritedStations, setFavoritedStations] = useLocalStorage<RadioStation[]>('favoritedStations', []);
  const [volume, setVolume] = useLocalStorage<number>('volume', 50);
  
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const api = useMemo(() => new RadioBrowserAPI(), []);

  useEffect(() => {
    const loadCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const countriesData = await api.getCountries();
        const filteredCountries = countriesData
          .filter(country => country.stationcount > 0)
          .sort((a, b) => b.stationcount - a.stationcount);
        setCountries(filteredCountries);
      } catch (error) {
        console.error('Failed to load countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    if (view === 'browse' && browseView === 'countries') {
      loadCountries();
    }
  }, [api, view, browseView]);

  useEffect(() => {
    const performGlobalSearch = async () => {
      if (browseView === 'countries' && searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          const searchResults = await api.globalSearch(searchQuery, 50);
          const convertedResults = convertRadioBrowserStations(searchResults);
          setGlobalSearchResults(convertedResults);
        } catch (error) {
          console.error('Global search failed:', error);
          setGlobalSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setGlobalSearchResults([]);
      }
    };

    const timeoutId = setTimeout(performGlobalSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [api, browseView, searchQuery]);

  const allStations = useMemo(() => {
    if (browseView === 'countries') {
      return [...customStations, ...globalSearchResults];
    }
    return [...apiStations];
  }, [customStations, apiStations, browseView, globalSearchResults]);

  const filteredStations = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allStations.filter(station => 
      station.name.toLowerCase().includes(query) ||
      station.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      station.country?.toLowerCase().includes(query)
    );
  }, [allStations, searchQuery]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(country => 
      country.name.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);

  const filteredCustomStations = useMemo(() => {
    if (browseView !== 'countries' || !searchQuery.trim()) return customStations;
    const query = searchQuery.toLowerCase();
    return customStations.filter(station => 
      station.name.toLowerCase().includes(query) ||
      station.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      station.country?.toLowerCase().includes(query)
    );
  }, [customStations, searchQuery, browseView]);

  const libraryStations = useMemo(() => {
    const allFavoriteStations = [
      ...customStations.filter(station => favorites.includes(station.id)),
      ...favoritedStations.filter(station => favorites.includes(station.id))
    ];
    
    const uniqueStations = allFavoriteStations.reduce((acc, station) => {
      if (!acc.find(s => s.id === station.id)) {
        acc.push(station);
      }
      return acc;
    }, [] as RadioStation[]);
    
    return uniqueStations;
  }, [customStations, favoritedStations, favorites]);

  const displayedStations = view === 'library' ? libraryStations : filteredStations;

  const handleCountrySelect = async (country: Country) => {
    setSelectedCountry(country);
    setBrowseView('stations');
    setIsLoadingStations(true);
    setSearchQuery('');
    setGlobalSearchResults([]);
    
    try {
      const stationsData = await api.getStationsByCountry(country.name, 500);
      const convertedStations = convertRadioBrowserStations(stationsData);
      setApiStations(convertedStations);
    } catch (error) {
      console.error('Failed to load stations for country:', error);
      setApiStations([]);
    } finally {
      setIsLoadingStations(false);
    }
  };

  const handleBackToCountries = () => {
    setBrowseView('countries');
    setSelectedCountry(null);
    setApiStations([]);
    setSearchQuery('');
    setGlobalSearchResults([]);
  };

  const handleHomeClick = () => {
    setView('browse');
    setBrowseView('countries');
    setSearchQuery('');
    setSelectedCountry(null);
    setApiStations([]);
    setGlobalSearchResults([]);
  };

  const handleStationSelect = (station: RadioStation) => {
    if (currentStation?.id === station.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStation(station);
      setIsPlaying(true);
      if (!station.isCustom && station.id.includes('-')) {
        api.recordClick(station.id);
      }
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleToggleFavorite = (stationId: string) => {
    setFavorites((prev: string[]) => {
      const isCurrentlyFavorited = prev.includes(stationId);
      
      if (isCurrentlyFavorited) {
        return prev.filter((id: string) => id !== stationId);
      } else {
        const station = [...customStations, ...apiStations, ...globalSearchResults].find(s => s.id === stationId);
        if (station && !station.isCustom) {
          setFavoritedStations((prevFavorited: RadioStation[]) => {
            if (!prevFavorited.find(s => s.id === stationId)) {
              return [...prevFavorited, station];
            }
            return prevFavorited;
          });
        }
        return [...prev, stationId];
      }
    });
  };

  const handleAddCustomStation = (station: RadioStation) => {
    setCustomStations((prev: RadioStation[]) => [...prev, station]);
  };

  const handleDeleteCustomStation = (stationId: string) => {
    setCustomStations((prev: RadioStation[]) => prev.filter((s: RadioStation) => s.id !== stationId));
    setFavorites((prev: string[]) => prev.filter((id: string) => id !== stationId));
    setFavoritedStations((prev: RadioStation[]) => prev.filter((s: RadioStation) => s.id !== stationId));
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

  // Breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; onClick?: () => void; }[] = [{ label: 'Browse', onClick: () => handleBackToCountries() }];
    
    if (selectedCountry && browseView === 'stations') {
      items.push({ label: selectedCountry.name });
    }
    
    return items;
  }, [selectedCountry, browseView]);

  const renderSearchResults = () => {
    if (!searchQuery.trim() || browseView !== 'countries') return null;

    if (isSearching) {
      return (
        <div className="search-results-section">
          <div className="section-header">
            <h3 className="section-title">
              <Radio size={20} />
              Searching...
            </h3>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Searching radio stations...</p>
          </div>
        </div>
      );
    }

    if (globalSearchResults.length > 0) {
      return (
        <div className="search-results-section">
          <div className="section-header">
            <h3 className="section-title">
              <Radio size={20} />
              Radio Stations ({globalSearchResults.length})
            </h3>
          </div>
          <div className="search-results-grid">
            {globalSearchResults.map((station) => {
              const isCurrent = currentStation?.id === station.id;
              const isFavorite = favorites.includes(station.id);
              
              return (
                <div
                  key={station.id}
                  className={`search-result-card ${isCurrent ? 'active' : ''}`}
                  onClick={() => handleStationSelect(station)}
                >
                  <div className="search-result-header">
                    <div className="search-result-icon">
                      {station.favicon ? (
                        <img src={station.favicon} alt={station.name} />
                      ) : (
                        <Radio size={16} className="default-icon-small" />
                      )}
                    </div>
                    <div className="search-result-info">
                      <h4 className="text-clamp-2" title={station.name}>{station.name}</h4>
                    </div>
                  </div>
                  <div className="search-result-meta">
                    {station.country && <span>{station.country}</span>}
                    {station.bitrate && <span>{station.bitrate} kbps</span>}
                    {station.tags && station.tags.length > 0 && (
                      <span>{station.tags.slice(0, 2).join(', ')}</span>
                    )}
                  </div>
                  <div className="search-result-actions">
                    <button
                      className={`action-btn ${isFavorite ? 'favorite' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(station.id);
                      }}
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {isFavorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
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

    return null;
  };

  const renderBrowseContent = () => {
    if (browseView === 'countries') {
      return (
        <>
          <div className="browse-header">
            <h2 className="browse-title">
              <Globe size={24} />
              Browse Radio Stations
            </h2>
          </div>
          
          <CustomStationsSection
            stations={filteredCustomStations}
            currentStation={currentStation}
            isPlaying={isPlaying}
            favorites={favorites}
            onStationSelect={handleStationSelect}
            onToggleFavorite={handleToggleFavorite}
            onDeleteStation={handleDeleteCustomStation}
            onAddStation={() => setIsAddModalOpen(true)}
          />

          {renderSearchResults()}

          <div className="section-header">
            <h3 className="section-title">
              <Globe size={20} />
              Countries {!searchQuery.trim() && `(${countries.length})`}
            </h3>
          </div>
          <CountryList 
            countries={filteredCountries} 
            isLoading={isLoadingCountries}
            onCountrySelect={handleCountrySelect}
          />
        </>
      );
    }

    return (
      <>
        <Breadcrumb items={breadcrumbItems} />
        <div className="browse-header">
          <h2 className="browse-title">
            Radio Stations in {selectedCountry?.name}
          </h2>
          <div className="browse-actions">
            <button className="back-btn" onClick={handleBackToCountries}>
              <ArrowLeft size={16} />
              Back to Countries
            </button>
          </div>
        </div>
        {isLoadingStations ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading stations...</p>
          </div>
        ) : (
          <StationList
            stations={displayedStations}
            currentStation={currentStation}
            isPlaying={isPlaying}
            favorites={favorites}
            onStationSelect={handleStationSelect}
            onToggleFavorite={handleToggleFavorite}
            onDeleteCustomStation={handleDeleteCustomStation}
          />
        )}
      </>
    );
  };

  const getSearchPlaceholder = () => {
    if (view === 'library') return 'Search your library...';
    if (browseView === 'countries') return 'Search countries and radio stations...';
    return `Search stations in ${selectedCountry?.name || 'country'}...`;
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand" onClick={handleHomeClick}>
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
            placeholder={getSearchPlaceholder()}
          />
          {browseView === 'stations' && (
            <button 
              className="btn-primary add-station-btn"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={20} />
              Add Station
            </button>
          )}
        </div>

        <div className="content-body">
          {view === 'browse' ? (
            renderBrowseContent()
          ) : (
            <StationList
              stations={displayedStations}
              currentStation={currentStation}
              isPlaying={isPlaying}
              favorites={favorites}
              onStationSelect={handleStationSelect}
              onToggleFavorite={handleToggleFavorite}
              onDeleteCustomStation={handleDeleteCustomStation}
            />
          )}
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
