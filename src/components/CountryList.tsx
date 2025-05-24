import { Globe, MapPin } from 'lucide-react';
import { Country } from '../services/radioBrowserApi';

interface CountryListProps {
  countries: Country[];
  isLoading: boolean;
  onCountrySelect: (country: Country) => void;
}

export function CountryList({ countries, isLoading, onCountrySelect }: CountryListProps) {
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading countries...</p>
      </div>
    );
  }

  if (countries.length === 0) {
    return (
      <div className="no-results">
        <Globe size={48} />
        <p>No countries found</p>
      </div>
    );
  }

  const sortedCountries = [...countries].sort((a, b) => {
    // Sort by station count descending, then by name ascending
    if (a.stationcount !== b.stationcount) {
      return b.stationcount - a.stationcount;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="country-list">
      <div className="country-grid">
        {sortedCountries.map((country) => (
          <div
            key={country.name}
            className="country-card"
            onClick={() => onCountrySelect(country)}
          >
            <div className="country-header">
              <MapPin size={20} className="country-icon" />
              <h3 className="country-name">{country.name}</h3>
            </div>
            <div className="country-stats">
              <span className="station-count">
                {country.stationcount} {country.stationcount === 1 ? 'station' : 'stations'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 