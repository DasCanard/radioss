import { RadioStation } from '../types';
import { RadioBrowserStation } from './radioBrowserApi';

export function convertRadioBrowserStation(station: RadioBrowserStation): RadioStation {
  return {
    id: station.stationuuid,
    name: station.name || 'Unknown Station',
    url: station.url_resolved || station.url,
    favicon: station.favicon || undefined,
    country: station.country || undefined,
    language: station.language || undefined,
    tags: station.tags ? station.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined,
    bitrate: station.bitrate || undefined,
    isCustom: false
  };
}

export function convertRadioBrowserStations(stations: RadioBrowserStation[]): RadioStation[] {
  return stations.map(convertRadioBrowserStation);
} 