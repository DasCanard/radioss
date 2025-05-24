export interface RadioStation {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  country?: string;
  language?: string;
  tags?: string[];
  bitrate?: number;
  isCustom?: boolean;
}

export interface PlayerState {
  isPlaying: boolean;
  currentStation: RadioStation | null;
  volume: number;
} 