import { useState, useMemo, useEffect } from 'react';
import { Library, Plus, Home, ArrowLeft, Globe, Radio, Star, StarOff, Settings } from 'lucide-react';
import './App.css';
import { RadioStation } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLoadingScreen } from './hooks/useLoadingScreen';
import { useDiscordRPC } from './hooks/useDiscordRPC';
import { useMinimizeToTray } from './hooks/useMinimizeToTray';
import { Player } from './components/Player';
import { StationList } from './components/StationList';
import { SearchBar } from './components/SearchBar';
import { AddStationModal } from './components/AddStationModal';
import { Footer } from './components/Footer';
import { UpdateNotification } from './components/UpdateNotification';
import { SettingsModal } from './components/SettingsModal';
import { CountryList } from './components/CountryList';
import { CustomStationsSection } from './components/CustomStationsSection';
import { Breadcrumb } from './components/Breadcrumb';
import { Pagination } from './components/Pagination';
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
  const [countrySearchResults, setCountrySearchResults] = useState<RadioStation[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingInCountry, setIsSearchingInCountry] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreStations, setHasMoreStations] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStationsCount, setTotalStationsCount] = useState(0);
  
  // Pagination state for search results
  const [globalSearchPage, setGlobalSearchPage] = useState(1);
  const [globalSearchTotal, setGlobalSearchTotal] = useState(0);
  const [countrySearchPage, setCountrySearchPage] = useState(1);
  const [countrySearchTotal, setCountrySearchTotal] = useState(0);
  const SEARCH_RESULTS_PER_PAGE = 50;
  
  const [customStations, setCustomStations] = useLocalStorage<RadioStation[]>('customStations', []);
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);
  const [favoritedStations, setFavoritedStations] = useLocalStorage<RadioStation[]>('favoritedStations', []);
  const [volume, setVolume] = useLocalStorage<number>('volume', 50);
  
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [discordRPCEnabled, setDiscordRPCEnabled] = useLocalStorage<boolean>('discordRPCEnabled', true);
  const [minimizeToTrayEnabled, setMinimizeToTrayEnabled] = useLocalStorage<boolean>('minimizeToTrayEnabled', false);

  const api = useMemo(() => new RadioBrowserAPI(), []);
  const { updateActivity, clearActivity } = useDiscordRPC(discordRPCEnabled, setDiscordRPCEnabled);
  
  useMinimizeToTray(minimizeToTrayEnabled);

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
        setGlobalSearchPage(1); // Reset to first page on new search
        try {
          const { stations, totalCount } = await api.paginatedGlobalSearch(searchQuery, 1, SEARCH_RESULTS_PER_PAGE);
          const convertedResults = convertRadioBrowserStations(stations);
          setGlobalSearchResults(convertedResults);
          setGlobalSearchTotal(totalCount);
        } catch (error) {
          console.error('Global search failed:', error);
          setGlobalSearchResults([]);
          setGlobalSearchTotal(0);
        } finally {
          setIsSearching(false);
        }
      } else {
        setGlobalSearchResults([]);
        setGlobalSearchTotal(0);
        setGlobalSearchPage(1);
      }
    };

    const timeoutId = setTimeout(performGlobalSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [api, browseView, searchQuery, SEARCH_RESULTS_PER_PAGE]);

  // Search within selected country
  useEffect(() => {
    const performCountrySearch = async () => {
      if (browseView === 'stations' && selectedCountry && searchQuery.trim().length > 2) {
        setIsSearchingInCountry(true);
        setCountrySearchPage(1); // Reset to first page on new search
        try {
          const { stations, totalCount } = await api.paginatedCountrySearch(selectedCountry.name, searchQuery, 1, SEARCH_RESULTS_PER_PAGE);
          const convertedResults = convertRadioBrowserStations(stations);
          setCountrySearchResults(convertedResults);
          setCountrySearchTotal(totalCount);
        } catch (error) {
          console.error('Country search failed:', error);
          setCountrySearchResults([]);
          setCountrySearchTotal(0);
        } finally {
          setIsSearchingInCountry(false);
        }
      } else {
        setCountrySearchResults([]);
        setCountrySearchTotal(0);
        setCountrySearchPage(1);
      }
    };

    const timeoutId = setTimeout(performCountrySearch, 300);
    return () => clearTimeout(timeoutId);
  }, [api, browseView, selectedCountry, searchQuery, SEARCH_RESULTS_PER_PAGE]);

  // Discord RPC Integration
  useEffect(() => {
    if (currentStation && isPlaying) {
      updateActivity(currentStation.name, currentStation.tags);
    } else {
      clearActivity();
    }
  }, [currentStation, isPlaying, updateActivity, clearActivity]);

  const allStations = useMemo(() => {
    if (browseView === 'countries') {
      return [...customStations, ...globalSearchResults];
    }
    // When in a country and searching, prioritize search results
    if (browseView === 'stations' && searchQuery.trim().length > 2 && countrySearchResults.length > 0) {
      return [...countrySearchResults];
    }
    return [...apiStations];
  }, [customStations, apiStations, browseView, globalSearchResults, countrySearchResults, searchQuery]);

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
    setCountrySearchResults([]);
    setCurrentPage(1);
    setHasMoreStations(false);
    
    try {
      const stationsData = await api.getStationsByCountry(country.name, 2000);
      const convertedStations = convertRadioBrowserStations(stationsData);
      setApiStations(convertedStations);
      setTotalStationsCount(country.stationcount);
      setHasMoreStations(stationsData.length === 2000 && country.stationcount > 2000);
    } catch (error) {
      console.error('Failed to load stations for country:', error);
      setApiStations([]);
      setTotalStationsCount(0);
      setHasMoreStations(false);
    } finally {
      setIsLoadingStations(false);
    }
  };

  const handleGlobalSearchPageChange = async (page: number) => {
    if (!searchQuery.trim() || isSearching) return;
    
    setGlobalSearchPage(page);
    setIsSearching(true);
    
    try {
      const { stations, totalCount } = await api.paginatedGlobalSearch(searchQuery, page, SEARCH_RESULTS_PER_PAGE);
      const convertedResults = convertRadioBrowserStations(stations);
      setGlobalSearchResults(convertedResults);
      setGlobalSearchTotal(totalCount);
    } catch (error) {
      console.error('Global search page change failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCountrySearchPageChange = async (page: number) => {
    if (!searchQuery.trim() || !selectedCountry || isSearchingInCountry) return;
    
    setCountrySearchPage(page);
    setIsSearchingInCountry(true);
    
    try {
      const { stations, totalCount } = await api.paginatedCountrySearch(selectedCountry.name, searchQuery, page, SEARCH_RESULTS_PER_PAGE);
      const convertedResults = convertRadioBrowserStations(stations);
      setCountrySearchResults(convertedResults);
      setCountrySearchTotal(totalCount);
    } catch (error) {
      console.error('Country search page change failed:', error);
    } finally {
      setIsSearchingInCountry(false);
    }
  };

  const handleBackToCountries = () => {
    setBrowseView('countries');
    setSelectedCountry(null);
    setApiStations([]);
    setSearchQuery('');
    setGlobalSearchResults([]);
    setCountrySearchResults([]);
    setCurrentPage(1);
    setHasMoreStations(false);
    setTotalStationsCount(0);
    setGlobalSearchPage(1);
    setGlobalSearchTotal(0);
    setCountrySearchPage(1);
    setCountrySearchTotal(0);
  };

  const handleHomeClick = () => {
    setView('browse');
    setBrowseView('countries');
    setSearchQuery('');
    setSelectedCountry(null);
    setApiStations([]);
    setGlobalSearchResults([]);
    setCountrySearchResults([]);
    setCurrentPage(1);
    setHasMoreStations(false);
    setTotalStationsCount(0);
    setGlobalSearchPage(1);
    setGlobalSearchTotal(0);
    setCountrySearchPage(1);
    setCountrySearchTotal(0);
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

    if (globalSearchResults.length > 0 || globalSearchTotal > 0) {
      const totalPages = Math.ceil(globalSearchTotal / SEARCH_RESULTS_PER_PAGE);
      
      return (
        <div className="search-results-section">
          <div className="section-header">
            <h3 className="section-title">
              <Radio size={20} />
              Radio Stations ({globalSearchTotal} total)
            </h3>
          </div>
          
          {globalSearchResults.length > 0 ? (
            <>
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
              
              {totalPages > 1 && (
                <Pagination
                  currentPage={globalSearchPage}
                  totalPages={totalPages}
                  totalItems={globalSearchTotal}
                  itemsPerPage={SEARCH_RESULTS_PER_PAGE}
                  onPageChange={handleGlobalSearchPageChange}
                  isLoading={isSearching}
                />
              )}
            </>
          ) : (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading search results...</p>
            </div>
          )}
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
            {searchQuery.trim().length > 2 && countrySearchTotal > 0 && (
              <span className="search-results-count"> - {countrySearchTotal} search results</span>
            )}
            {!searchQuery.trim() && apiStations.length > 0 && (
              <span className="stations-count"> - {apiStations.length}{totalStationsCount > apiStations.length ? ` of ${totalStationsCount}` : ''} stations</span>
            )}
          </h2>
          <div className="browse-actions">
            <button className="back-btn" onClick={handleBackToCountries}>
              <ArrowLeft size={16} />
              Back to Countries
            </button>
          </div>
        </div>
        {isLoadingStations || isSearchingInCountry ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{isSearchingInCountry ? 'Searching stations...' : 'Loading stations...'}</p>
          </div>
        ) : (
          <>
            <StationList
              stations={displayedStations}
              currentStation={currentStation}
              isPlaying={isPlaying}
              favorites={favorites}
              onStationSelect={handleStationSelect}
              onToggleFavorite={handleToggleFavorite}
              onDeleteCustomStation={handleDeleteCustomStation}
            />
            
            {/* Pagination for country search results */}
            {searchQuery.trim().length > 2 && countrySearchTotal > 0 && (
              <Pagination
                currentPage={countrySearchPage}
                totalPages={Math.ceil(countrySearchTotal / SEARCH_RESULTS_PER_PAGE)}
                totalItems={countrySearchTotal}
                itemsPerPage={SEARCH_RESULTS_PER_PAGE}
                onPageChange={handleCountrySearchPageChange}
                isLoading={isSearchingInCountry}
              />
            )}
            
            {/* Load more for non-search results */}
            {hasMoreStations && !searchQuery.trim() && (
              <div className="load-more-section">
                <button 
                  className="btn-secondary load-more-btn" 
                  onClick={loadMoreStations}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <div className="spinner"></div>
                      Loading more stations...
                    </>
                  ) : (
                    <>
                      Load More Stations ({totalStationsCount - apiStations.length} remaining)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  const getSearchPlaceholder = () => {
    if (view === 'library') return 'Search your library...';
    if (browseView === 'countries') return 'Search countries and radio stations...';
    return `Search stations in ${selectedCountry?.name || 'country'}...`;
  };

  const loadMoreStations = async () => {
    if (!selectedCountry || isLoadingMore || !hasMoreStations) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      // For Radio Browser API, we need to make a new request with higher limit
      const totalToLoad = Math.min((nextPage * 2000), totalStationsCount);
      const stationsData = await api.getStationsByCountry(selectedCountry.name, totalToLoad);
      const convertedStations = convertRadioBrowserStations(stationsData);
      
      setApiStations(convertedStations);
      setCurrentPage(nextPage);
      setHasMoreStations(convertedStations.length < totalStationsCount);
    } catch (error) {
      console.error('Failed to load more stations:', error);
    } finally {
      setIsLoadingMore(false);
    }
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
        <div className="header-right">
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
          <button 
            className="settings-btn"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        discordRPCEnabled={discordRPCEnabled}
        onDiscordRPCToggle={setDiscordRPCEnabled}
        minimizeToTrayEnabled={minimizeToTrayEnabled}
        onMinimizeToTrayToggle={setMinimizeToTrayEnabled}
      />

      <UpdateNotification />
    </div>
  );
}

export default App;
