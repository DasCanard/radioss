const API_BASE_URL = 'https://de1.api.radio-browser.info/json';
const USER_AGENT = 'Radioss/1.0';

export interface Country {
  name: string;
  stationcount: number;
}

export interface RadioBrowserStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  languagecodes: string;
  votes: number;
  lastchangetime: string;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  lastchecktime: string;
  lastcheckoktime: string;
  clicktimestamp: string;
  clickcount: number;
  clicktrend: number;
  geo_lat: number | null;
  geo_long: number | null;
}

export interface Tag {
  name: string;
  stationcount: number;
}

export class RadioBrowserAPI {
  private baseUrl: string;
  private userAgent: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.userAgent = USER_AGENT;
  }

  private async fetchWithUserAgent(url: string): Promise<Response> {
    return fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
      },
    });
  }

  async getCountries(): Promise<Country[]> {
    try {
      const response = await this.fetchWithUserAgent(`${this.baseUrl}/countries`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  async getStationsByCountry(countryName: string, limit: number = 100): Promise<RadioBrowserStation[]> {
    try {
      const encodedCountry = encodeURIComponent(countryName);
      const response = await this.fetchWithUserAgent(
        `${this.baseUrl}/stations/bycountryexact/${encodedCountry}?limit=${limit}&hidebroken=true`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching stations by country:', error);
      throw error;
    }
  }

  async searchStations(params: {
    name?: string;
    country?: string;
    tag?: string;
    limit?: number;
    offset?: number;
  }): Promise<RadioBrowserStation[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.name) searchParams.set('name', params.name);
      if (params.country) searchParams.set('country', params.country);
      if (params.tag) searchParams.set('tag', params.tag);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());
      searchParams.set('hidebroken', 'true');

      const response = await this.fetchWithUserAgent(
        `${this.baseUrl}/stations/search?${searchParams.toString()}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching stations:', error);
      throw error;
    }
  }

  async getAllTags(): Promise<Tag[]> {
    try {
      const response = await this.fetchWithUserAgent(`${this.baseUrl}/tags?limit=500`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  async globalSearch(query: string, limit: number = 100): Promise<RadioBrowserStation[]> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('name', query);
      searchParams.set('limit', limit.toString());
      searchParams.set('hidebroken', 'true');

      const response = await this.fetchWithUserAgent(
        `${this.baseUrl}/stations/search?${searchParams.toString()}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in global search:', error);
      throw error;
    }
  }

  async recordClick(stationUuid: string): Promise<void> {
    try {
      await this.fetchWithUserAgent(`${this.baseUrl}/url/${stationUuid}`);
    } catch (error) {
      console.error('Error recording click:', error);
      // Don't throw here, as click recording is not critical
    }
  }
} 